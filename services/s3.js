const AWS = require('aws-sdk');
require('dotenv').config();

exports.uploadToS3 = async (data, fileName) => {
    let s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })

    let params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: data,
        ACL: 'public-read'
    }
    return new Promise((resolve, reject) => {
        s3bucket.upload(params, (err, s3response) => {
            if (err) {
                console.log('Something went wrong', err);
                reject(err);
            } else {
                console.log('success', s3response);
                resolve(s3response.Location);
            }
        });
    });

};