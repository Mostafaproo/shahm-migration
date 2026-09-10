import auth from './en/auth.json'
import common from './en/common.json'
import home from './en/home.json'
import validation from './en/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    home,
    validation
  )
)
