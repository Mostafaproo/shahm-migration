import type { HttpClient } from '~/core/http'

export function useHttp(): HttpClient {
  const { $http } = useNuxtApp()
  if (!$http) throw new Error('[useHttp] called before the http plugin provided $http')
  return $http as HttpClient
}
