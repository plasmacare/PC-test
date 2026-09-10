import { Link } from 'react-router-dom'
import { useLanguage } from '../lib/i18n.jsx'
import logoFull from '../assets/logo-full.png'
import './B2BInfo.css'

export default function B2BInfo() {
  const { t } = useLanguage()

  return (
    <div className="b2b-info">
      <img src={logoFull} alt="Plasma Care" className="b2b-info__logo" />

      <h1 className="b2b-info__title">{t('b2bPageTitle')}</h1>
      <p className="b2b-info__tagline">{t('b2bPageTagline')}</p>

      <p className="b2b-info__body">{t('b2bPageBody')}</p>

      <ul className="b2b-info__features">
        <li>{t('b2bFeature1')}</li>
        <li>{t('b2bFeature2')}</li>
        <li>{t('b2bFeature3')}</li>
        <li>{t('b2bFeature4')}</li>
      </ul>

      <Link to="/portal/request-access" className="btn btn--primary b2b-info__cta">
        {t('b2bRegisterCta')}
      </Link>

      <Link to="/portal/login" className="b2b-info__login-link">
        {t('b2bLoginCta')}
      </Link>

      <Link to="/" className="b2b-info__back">← Back to home</Link>
    </div>
  )
}
