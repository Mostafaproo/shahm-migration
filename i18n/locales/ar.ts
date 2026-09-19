import auth from './ar/auth.json'
import certificates from './ar/certificates.json'
import common from './ar/common.json'
import computerized from './ar/computerized.json'
import contact from './ar/contact.json'
import courses from './ar/courses.json'
import dashboard from './ar/dashboard.json'
import discussion from './ar/discussion.json'
import files from './ar/files.json'
import upload from './ar/upload.json'
import home from './ar/home.json'
import instructorCourses from './ar/instructorCourses.json'
import instructorAssessments from './ar/instructorAssessments.json'
import invitations from './ar/invitations.json'
import notifications from './ar/notifications.json'
import packages from './ar/packages.json'
import pathways from './ar/pathways.json'
import privacy from './ar/privacy.json'
import questions from './ar/questions.json'
import quizzes from './ar/quizzes.json'
import reports from './ar/reports.json'
import user from './ar/user.json'
import validation from './ar/validation.json'

export default defineI18nLocale(() =>
  Object.assign(
    {},
    auth,
    certificates,
    common,
    computerized,
    contact,
    courses,
    dashboard,
    discussion,
    files,
    upload,
    home,
    instructorCourses,
    instructorAssessments,
    invitations,
    notifications,
    packages,
    pathways,
    privacy,
    questions,
    quizzes,
    reports,
    user,
    validation
  )
)
