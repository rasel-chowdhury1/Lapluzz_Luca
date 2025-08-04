import AWS from 'aws-sdk';
import fs, { access } from 'fs';

// configure aws 
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  })

export const uploadFileToS3 = async (file: any) => {
    const params  = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${Date.now()}_${file.originalname}`,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype
    } as any;
  
    return await s3.upload(params).promise()
  }


export const uploadMultipleFilesToS3 = async (
  files: { [fieldname: string]: Express.Multer.File[] },
): Promise<{ [fieldname: string]: string[] }> => {
  const uploadedFileMap: { [fieldname: string]: string[] } = {};

  for (const field in files) {
    const fileList = files[field];

    const uploadPromises = fileList.map(async (file) => {
      try {
        const data = await uploadFileToS3(file);
        if (!uploadedFileMap[field]) {
          uploadedFileMap[field] = [];
        }
        uploadedFileMap[field].push(data.Location);

        // Remove local file
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`❌ Error uploading ${file.originalname}:`, err);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    });

    await Promise.all(uploadPromises);
  }

  return uploadedFileMap;
};
