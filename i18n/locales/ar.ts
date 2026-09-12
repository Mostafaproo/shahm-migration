import auth from './ar/auth.json'
import common from './ar/common.json'
import courses from './ar/courses.json'
import home from './ar/home.json'
import packages from './ar/packages.json'
import user from './ar/user.json'
import validation from './ar/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    courses,
    home,
    packages,
    user,
    validation
  )
)
