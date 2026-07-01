import { createCrudService } from './crudServiceFactory'

/**
 * skillsService
 * CRUD operations for the Skills resource using the shared api service factory.
 */
const skillsService = createCrudService('/skills')

export default skillsService
