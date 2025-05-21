import { ConflictException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { log } from 'console';

const slugify = require('slugify');

@Injectable()
export class MicrosoftAzureService implements OnModuleInit {

    private logger = new Logger(MicrosoftAzureService.name);

    private STORAGE_PATH = path.join(__dirname + '/uploads');
    private BLOB_CONTAINERS: Array<BlobServiceClient> = [];
    private containerName = process.env.AZURE_CONTAINER;

    async onModuleInit() {
        this.logger.log("Establishing connection to Microsoft Azure ...")
        await this.initAzureBlobStorage()
    }


    private async initAzureBlobStorage() {
        // log("<<<<<<<<<<<<<<< Instantiating Azure BLOB Storage intiated >>>>>>>>>>>>>>");
        let accountName = process.env.AZURE_BLOB_ACCOUNT_NAME, accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY;

        const storageAccountBaseUrl = `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        this.BLOB_CONTAINERS[0] = new BlobServiceClient(
            storageAccountBaseUrl,
            sharedKeyCredential
        );

        this.logger.debug("Done initializing Azure Blob storage")
        // log("<<<<<<<<<<<<<<< Instantiating Azure BLOB Storage finalized >>>>>>>>>>>>>>");
    }


    async uploadFiles(files: Array<any>) {
        try {

            log({files})

            let images = [], resource_base_url = `https://campaignbucket.blob.core.windows.net/${this.containerName}`;
            // log({ files })
            const formdata = new FormData();
            // var hasVideoUpload = false;

            for (let _file of files) {

                let { path, originalname, mimetype, encoding, buffer } = _file;//, file = fs.readFileSync(path);

                let name = originalname;

                let uuid = uuidv4();

                originalname = uuid.toString() + "-" + originalname;
                originalname = slugify(originalname)

                const containerClient = this.BLOB_CONTAINERS[0].getContainerClient(this.containerName);
                const blockBlobClient = await containerClient.getBlockBlobClient(originalname);

                let _data = await blockBlobClient.upload(buffer, buffer.length);

                log({data: _data})

                let url = `${resource_base_url}/${originalname}`

                images.push({ url, name, originalname });
            }

            // log({ images })

            return images;

        } catch (error: any) {
            log("Upload Error: ", error.response)
            log(error.response.data)
            return null;
        }

    }



}
