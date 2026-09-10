export default defineNuxtPlugin(() => {
  const toast = useToast()

  const globalConfig = {
    timeout: 4000,
    position: 'bottom-center' as const
  }

  const customToast = {
    success(title: string, description?: string) {
      toast.add({
        ...globalConfig,
        title,
        description,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    },
    error(title: string, description?: string) {
      toast.add({
        ...globalConfig,
        title,
        description,
        color: 'error',
        icon: 'i-lucide-x-circle'
      })
    },
    info(title: string, description?: string) {
      toast.add({
        ...globalConfig,
        title,
        description,
        color: 'info',
        icon: 'i-lucide-info'
      })
    }
  }

  return {
    provide: {
      appToast: customToast
    }
  }
})
