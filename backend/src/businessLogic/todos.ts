import { TodosDataLayer } from '../dataLayer/todosDataLayer'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import CustomError from "../utils/CustomError";
import {TodoUpdate} from "../models/TodoUpdate";

// TODO: Implement businessLogic
const logger = createLogger('businessLogic-todos')

const todosDataLayer = new TodosDataLayer();

export async function getTodos(
    userId: string
): Promise<TodoItem[] | CustomError> {
    try {
        const todos = await todosDataLayer.getTodosByUserId(userId)
        logger.info(`Todos of user: ${userId}`, JSON.stringify(todos))
        return todos
    } catch (error) {
        const errorMsg = `Error occurred when getting user's todos`
        logger.error(errorMsg)
        return new CustomError(errorMsg, 500)
    }
}

export async function createTodo(
    userId: string,
    createTodoRequest: CreateTodoRequest
): Promise<TodoItem | CustomError> {
    const todoId = uuid.v4()

    const newItem: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: null,
        ...createTodoRequest
    }

    try {
        await todosDataLayer.createTodoItem(newItem)
        logger.info(`Todo ${todoId} for user ${userId}:`, {
            userId,
            todoId,
            todoItem: newItem
        })
        return newItem
    } catch (error) {
        const errorMsg = `Error occurred when creating user todo item`
        logger.error(errorMsg)
        return new CustomError(errorMsg, 500)
    }
}

export async function updateTodo(
    userId: string,
    todoId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<void | CustomError> {
    try {
        const item = await todosDataLayer.getTodoItem(todoId)

        if (!item) throw new CustomError('Item not found', 404)

        if (item.userId !== userId) {
            throw new CustomError('User is not authorized to update item', 403)
        }

        await todosDataLayer.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
        logger.info(`Updating todo ${todoId} for user ${userId}:`, {
            userId,
            todoId,
            todoUpdate: updateTodoRequest
        })
    } catch (error) {
        if (!error.code) {
            error.code = 500
            error.message = 'Error occurred when updating todo item'
        }
        logger.error(error.message)
        return error
    }
}

export async function deleteTodo(
    userId: string,
    todoId: string
): Promise<void | CustomError> {
    try {
        const item = await todosDataLayer.getTodoItem(todoId)

        if (!item) throw new CustomError('Item not found', 404)

        if (item.userId !== userId) {
            throw new CustomError('User is not authorized to delete item', 403)
        }

        await todosDataLayer.deleteTodoItem(todoId)

        logger.info(`Deleting todo ${todoId} for user ${userId}:`, {
            userId,
            todoId
        })
    } catch (error) {
        if (!error.code) {
            error.code = 500
            error.message = 'Error occurred when deleting todo item'
        }
        logger.error(error.message)
        return error
    }
}

export async function updateAttachmentUrl(
    userId: string,
    todoId: string,
    attachmentId: string
): Promise<void | CustomError> {
    try {
        const attachmentUrl = todosDataLayer.getAttachmentUrl(attachmentId)

        const item = await todosDataLayer.getTodoItem(todoId)

        if (!item) throw new CustomError('Item not found', 404)

        if (item.userId !== userId) {
            throw new CustomError('User is not authorized to update item', 403)
        }

        await todosDataLayer.updateAttachmentUrl(todoId, attachmentUrl)

        logger.info(
            `Updating todo ${todoId} with attachment URL ${attachmentUrl}`,
            {
                userId,
                todoId
            }
        )
    } catch (error) {
        if (!error.code) {
            error.code = 500
            error.message = 'Error occurred when deleting todo item'
        }
        logger.error(error.message)
        return error
    }
}

export function generateSignedUrl(attachmentId: string): string | CustomError {
    try {
        const uploadUrl = todosDataLayer.getUploadUrl(attachmentId)
        logger.info(`Presigned Url is generated: ${uploadUrl}`)

        return uploadUrl
    } catch (error) {
        const errorMsg = 'Error occurred when generating presigned Url to upload'
        logger.error(errorMsg)
        return new CustomError(errorMsg, 500)
    }
}
