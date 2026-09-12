import auth from './en/auth.json'
import common from './en/common.json'
import courses from './en/courses.json'
import dashboard from './en/dashboard.json'
import home from './en/home.json'
import notifications from './en/notifications.json'
import packages from './en/packages.json'
import user from './en/user.json'
import validation from './en/validation.json'

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
