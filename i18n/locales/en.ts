import auth from './en/auth.json'
import certificates from './en/certificates.json'
import common from './en/common.json'
import computerized from './en/computerized.json'
import contact from './en/contact.json'
import courses from './en/courses.json'
import dashboard from './en/dashboard.json'
import discussion from './en/discussion.json'
import files from './en/files.json'
import upload from './en/upload.json'
import home from './en/home.json'
import instructorCourses from './en/instructorCourses.json'
import instructorProjects from './en/instructorProjects.json'
import instructorAssessments from './en/instructorAssessments.json'
import invitations from './en/invitations.json'
import notifications from './en/notifications.json'
import packages from './en/packages.json'
import pathways from './en/pathways.json'
import privacy from './en/privacy.json'
import questions from './en/questions.json'
import quizzes from './en/quizzes.json'
import reports from './en/reports.json'
import user from './en/user.json'
import validation from './en/validation.json'

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
    instructorProjects,
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
