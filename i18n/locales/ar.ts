import auth from './ar/auth.json'
import common from './ar/common.json'
import courses from './ar/courses.json'
import home from './ar/home.json'
import validation from './ar/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    courses,
    home,
    validation
  )
)
