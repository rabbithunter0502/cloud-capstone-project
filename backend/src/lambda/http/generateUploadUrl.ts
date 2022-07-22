import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as middy from 'middy'
import {cors, httpErrorHandler} from 'middy/middlewares'
import * as uuid from 'uuid'
import CustomError from "../../utils/CustomError";
import {generateSignedUrl, updateAttachmentUrl} from "../../helpers/todos";
import {createLogger} from "../../utils/logger";

const logger = createLogger('generateUploadUrl')

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('generateUploadUrl event', { event })

        const todoId = event.pathParameters.todoId
        const userId = event.requestContext.authorizer.principalId
        const attachmentId = uuid.v4()
        logger.info(`attachmentId ${attachmentId}`, attachmentId)
        const uploadUrlRes = generateSignedUrl(attachmentId)

        logger.info(`Generating signed url ${uploadUrlRes}`, uploadUrlRes)

        if (uploadUrlRes instanceof CustomError) {
            return {
                statusCode: uploadUrlRes.code,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ msg: uploadUrlRes.message })
            }
        }

        const uploadAttachmentUrlRes = await updateAttachmentUrl(
            userId,
            todoId,
            attachmentId
        )
        if (uploadAttachmentUrlRes instanceof CustomError) {
            return {
                statusCode: uploadAttachmentUrlRes.code,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ msg: uploadAttachmentUrlRes.message })
            }
        }
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ uploadUrl: uploadUrlRes })
        }
    }
)

handler.use(httpErrorHandler()).use(
    cors({
        credentials: true
    })
)
