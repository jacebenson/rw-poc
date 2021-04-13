// Define what you want `currentUser` to return throughout your app. For example,
// to return a real user from your database, you could do something like:
//
//   export const getCurrentUser = async ({ email }) => {
//     return await db.user.findUnique({ where: { email } })
//   }
import { db } from 'src/lib/db'
import { AuthenticationError, ForbiddenError, parseJWT } from '@redwoodjs/api'

export const getCurrentUser = async (decoded, { token, type }) => {
  try {
    let user = await db.user.findUnique({
      where: { email: decoded.preferred_username }
    })
    //if no user found... create one
    let justRoles = [];
    console.log(user)
    if(user){
    let roles = await db.userRole.findMany({
      where: { userId: user.id }
    })
    justRoles = roles.map((role) => {
      return role.name
    })
    } else {
      //user is logged in but no user exists
      //this creates the user
      user = await db.user.create({
        data: {
         email: decoded.preferred_username,
         userName: decoded.preferred_username,
         name: decoded.name
        }
      })
    }
    return {
      decoded: {
        ...decoded
      },
      ...user,
      email: decoded.preferred_username ?? null,
      name: decoded.name ?? null,
      roles: [
        ...justRoles
      ]
    }
  } catch (error) {
    return error
  }
}

/*export const getCurrentUser = async (decoded) => {
  const userRoles = await db.userRole.findMany({
    where: { user: { email: decoded.preferred_username } },
    select: { name: true },
  })

  const roles = userRoles.map((role) => {
    return role.name
  })

  return context.currentUser || { roles }
}*/

// Use this function in your services to check that a user is logged in, and
// optionally raise an error if they're not.

/**
 * Use requireAuth in your services to check that a user is logged in,
 * whether or not they are assigned a role, and optionally raise an
 * error if they're not.
 *
 * @param {string=} roles - An optional role or list of roles
 * @param {string[]=} roles - An optional list of roles

 * @example
 *
 * // checks if currentUser is authenticated
 * requireAuth()
 *
 * @example
 *
 * // checks if currentUser is authenticated and assigned one of the given roles
 * requireAuth({ role: 'admin' })
 * requireAuth({ role: ['editor', 'author'] })
 * requireAuth({ role: ['publisher'] })
 */
export const requireAuth = ({ role } = {}) => {
  if (!context.currentUser) {
    throw new AuthenticationError("You don't have permission to do that.")
  }

  if (
    typeof role !== 'undefined' &&
    typeof role === 'string' &&
    !context.currentUser.roles?.includes(role)
  ) {
    throw new ForbiddenError("You don't have access to do that.")
  }

  if (
    typeof role !== 'undefined' &&
    Array.isArray(role) &&
    !context.currentUser.roles?.some((r) => role.includes(r))
  ) {
    throw new ForbiddenError("You don't have access to do that.")
  }
}
