import auth from './ar/auth.json'
import common from './ar/common.json'
import courses from './ar/courses.json'
import dashboard from './ar/dashboard.json'
import discussion from './ar/discussion.json'
import files from './ar/files.json'
import home from './ar/home.json'
import invitations from './ar/invitations.json'
import notifications from './ar/notifications.json'
import packages from './ar/packages.json'
import pathways from './ar/pathways.json'
import questions from './ar/questions.json'
import quizzes from './ar/quizzes.json'
import reports from './ar/reports.json'
import user from './ar/user.json'
import validation from './ar/validation.json'

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
    pathways,
    questions,
    quizzes,
    reports,
    user,
    validation
  )
)
