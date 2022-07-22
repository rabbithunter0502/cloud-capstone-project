import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'

import {verify} from 'jsonwebtoken'
import {createLogger} from '../../utils/logger'
import Axios from 'axios'
import {JwtPayload} from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  console.log(event);
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  // TODO: Implement token verification
  const token = authHeader.split(' ')[1];
  const cert = await fetchCertificate();
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

async function fetchCertificate(): Promise<string> {
  let auth0Cert;
  if (!auth0Cert) {
    const result = await Axios.get(process.env.AUTH0_CERT_URL);
    auth0Cert = result.data;
    console.log("Certificate fetched", auth0Cert);
  }
  return auth0Cert;
}
