import auth from './en/auth.json'
import common from './en/common.json'
import courses from './en/courses.json'
import dashboard from './en/dashboard.json'
import discussion from './en/discussion.json'
import files from './en/files.json'
import home from './en/home.json'
import invitations from './en/invitations.json'
import notifications from './en/notifications.json'
import packages from './en/packages.json'
import questions from './en/questions.json'
import quizzes from './en/quizzes.json'
import reports from './en/reports.json'
import user from './en/user.json'
import validation from './en/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    common,
    courses,
    dashboard,
    discussion,
    files,
    home,
    invitations,
    notifications,
    packages,
    questions,
    quizzes,
    reports,
    user,
    validation
  )
)
