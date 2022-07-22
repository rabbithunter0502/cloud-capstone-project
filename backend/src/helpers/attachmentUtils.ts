import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {createLogger} from "../utils/logger";

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('attachmentUtls')

// TODO: Implement the fileStogare logic
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export function getAttachmentUrl(attachmentId: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
}

export function getUploadUrl(attachmentId: string): string {
    logger.info(`Bucket ${bucketName}`)
    logger.info(`attachmentId ${attachmentId}`)
    logger.info(`urlExpiration ${urlExpiration}`)
    const uploadUrl = s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: attachmentId,
        Expires: 5000
    })
    logger.info(`Generated upload url ${uploadUrl}`)
    return uploadUrl;
}
