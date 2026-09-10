import { supabase } from '../../lib/supabase'

export async function fetchMyBulkRequests() {
  const { data, error } = await supabase
    .from('b2b_bulk_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// patients: [{ name, age, gender, phone, package_id, individual_test_id, test_label }, ...]
// Each patient carries their own test/package — a batch can mix
// different tests per person.
//
// This creates real `bookings` rows immediately (one per patient, tagged
// booking_type='home_collection' so they enter the same collection-staff
// dispatch flow as any other home-collection booking) — no separate
// admin "accept" step, since the company was already vetted when their
// access request was approved. The `b2b_bulk_requests` row itself is
// kept purely as a batch record for the company's own History page.
export async function submitRegistration({ b2bAccountId, patient, sampleCollectionTime, notes }) {
  if (!patient?.name || !patient?.age || !patient?.gender || !patient?.optionKey) {
    throw new Error('Patient name, age, gender and test/package are required.')
  }
  const scheduledDate = new Date().toLocaleDateString('en-CA')

  const { data: account, error: acctErr } = await supabase
    .from('b2b_accounts')
    .select('company_name, phone, address, latitude, longitude')
    .eq('id', b2bAccountId)
    .single()
  if (acctErr) throw acctErr

  const [{ data: packages }, { data: tests }] = await Promise.all([
    supabase.from('packages').select('id, price'),
    supabase.from('individual_tests').select('id, price'),
  ])
  const priceById = new Map([
    ...(packages || []).map((p) => [p.id, p.price]),
    ...(tests || []).map((t) => [t.id, t.price]),
  ])

  const { data: batch, error: batchErr } = await supabase
    .from('b2b_bulk_requests')
    .insert({
      b2b_account_id: b2bAccountId,
      preferred_date: scheduledDate,
      patients: [patient],
      sample_collection_time: sampleCollectionTime || null,
      notes: notes || null,
      status: 'submitted',
      bookings_created: true,
    })
    .select('id')
    .single()
  if (batchErr) throw batchErr

  for (const patient of [patient]) {
    const selectedPackages = patient.package_id ? [patient.package_id] : []
    const selectedTests = patient.individual_test_id ? [patient.individual_test_id] : []
    const priceKey = patient.package_id || patient.individual_test_id
    const totalAmount = priceKey ? priceById.get(priceKey) || 0 : 0

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        customer_name: patient.name,
        customer_phone: patient.phone || account.phone || '',
        booking_type: 'home_collection',
        selected_packages: selectedPackages,
        selected_tests: selectedTests,
        total_amount: totalAmount,
        scheduled_date: scheduledDate,
        sample_collection_time: sampleCollectionTime || null,
        status: 'pending',
        patient_name: patient.name,
        patient_age: patient.age ? Number(patient.age) : null,
        patient_gender: patient.gender ? patient.gender.toLowerCase() : null,
        b2b_bulk_request_id: batch.id,
        b2b_account_id: b2bAccountId,
        admin_notes: notes || null,
      })
      .select('id')
      .single()
    if (bookingErr) throw bookingErr

    if (account.address) {
      await supabase.from('addresses').insert({
        booking_id: booking.id,
        full_address: account.address,
        latitude: account.latitude,
        longitude: account.longitude,
      })
    }
  }
}

/** For the B2B company's own History page — live status/report links for the real bookings created from a batch. */
export async function fetchBookingsForBulkRequest(bulkRequestId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, patient_name, status, report_status, report_url')
    .eq('b2b_bulk_request_id', bulkRequestId)
  if (error) throw error
  return data || []
}
