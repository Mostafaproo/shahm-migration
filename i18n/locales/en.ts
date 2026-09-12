import auth from './en/auth.json'
import common from './en/common.json'
import courses from './en/courses.json'
import home from './en/home.json'
import packages from './en/packages.json'
import validation from './en/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    courses,
    home,
    packages,
    validation
  )
)
