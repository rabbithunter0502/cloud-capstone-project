import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosDataLayer')

const createDynamoDBClient = () => {
  // @ts-ignore
  const client: DocumentClient = new XAWS.DynamoDB.DocumentClient()
  return client;
}

const createS3Client = () => {
  return new XAWS.S3({ signatureVersion: 'v4' })
}

// Implement the dataLayer logic

export class TodosDataLayer {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3 = createS3Client(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly todosByUserIndex = process.env.TODOS_BY_USER_INDEX
  ) {
    //
  }

  getAttachmentUrl(attachmentId: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
  }

  getUploadUrl(attachmentId: string): string {
    logger.info(`Bucket ${this.bucketName}`)
    logger.info(`attachmentId ${attachmentId}`)
    logger.info(`urlExpiration ${this.urlExpiration}`)
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: attachmentId,
      Expires: 5000
    })
    logger.info(`Generated upload url ${uploadUrl}`)
    return uploadUrl
  }

  async todoItemExists(todoId: string): Promise<boolean> {
    const item = await this.getTodoItem(todoId)
    return !!item
  }

  async getTodosByUserId(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosByUserIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items

    logger.info(`All todos for user ${userId} were fetched`)

    return items as TodoItem[]
  }

  async getTodoItem(todoId: string): Promise<TodoItem> {
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId
        }
      })
      .promise()

    const item = result.Item

    logger.info(`Todo item ${item} was fetched`)

    return item as TodoItem
  }

  async createTodoItem(todoItem: TodoItem): Promise<void> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    logger.info(`Todo item ${todoItem.todoId} was created`)
  }

  async updateTodoItem(
    todoId: string,
    todoUpdate: TodoUpdate
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId
        },
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done, description = :description',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done,
          ':description': todoUpdate.description
        }
      })
      .promise()

    logger.info(`Todo item ${todoId} was updated`)
  }

  async deleteTodoItem(todoId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId
        }
      })
      .promise()

    logger.info(`Todo item ${todoId} deleted!`)
  }

  async updateAttachmentUrl(
    todoId: string,
    attachmentUrl: string
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()

    logger.info(`Attachment URL for todo ${todoId} was updated`)
  }
}
