import { mutations } from './mutations'
import { getters } from './getters'

export const module = {
  namespaced: true,
  state: {
    transaction: null
  },
  mutations,
  getters
}
