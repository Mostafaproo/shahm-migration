import auth from './ar/auth.json'
import common from './ar/common.json'
import courses from './ar/courses.json'
import dashboard from './ar/dashboard.json'
import home from './ar/home.json'
import notifications from './ar/notifications.json'
import packages from './ar/packages.json'
import user from './ar/user.json'
import validation from './ar/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    courses,
    dashboard,
    home,
    notifications,
    packages,
    user,
    validation
  )
)
