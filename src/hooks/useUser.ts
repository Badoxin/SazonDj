import { createUserApi, deleteUserApi, getMeApi, getUsersApi, updateUserApi } from "../api/user";

// Agrupa las operaciones de usuarios para que los componentes no hablen directo con la API.
export function useUser() {
  return {
    getMe: getMeApi,
    getUsers: getUsersApi,
    createUser: createUserApi,
    updateUser: updateUserApi,
    deleteUser: deleteUserApi,
  };
}
