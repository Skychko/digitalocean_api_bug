// source: https://docs.digitalocean.com/reference/api/spaces-api/
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import private_config from './private.js';

const { Bucket, endpoint, region, accessKeyId, secretAccessKey } = private_config.do_spaces;

const s3_client = new S3Client({
    endpoint,
    forcePathStyle: false,
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

export const upload = async (file_name, content) => {
    const params = {
        Bucket,
        Key: file_name,
        Body: content,
        ACL: 'public-read',
    };
    const data = await s3_client.send(new PutObjectCommand(params));
    return data;
};
