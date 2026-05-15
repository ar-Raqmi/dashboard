import { action } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthedUserId } from "./auth";
import { api } from "./_generated/api";

const getS3Client = () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 environment variables are not set");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const getUploadUrl = action({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthedUserId(ctx, args.sessionToken);
    
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: args.key,
      ContentType: args.contentType,
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  },
});

export const getDownloadUrl = action({
  args: {
    sessionToken: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthedUserId(ctx, args.sessionToken);
    
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: args.key,
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  },
});

export const deleteObject = action({
  args: {
    sessionToken: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthedUserId(ctx, args.sessionToken);
    
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: args.key,
    });

    await client.send(command);
  },
});

export const removeFile = action({
  args: { sessionToken: v.string(), id: v.id("files") },
  handler: async (ctx, { sessionToken, id }) => {
    await getAuthedUserId(ctx, sessionToken);
    
    // 1. Get file info (we need to call a query or use ctx.runQuery)
    // Actions can call queries
    const file = await ctx.runQuery(api.files.getFileInfo, { sessionToken, id });
    if (!file) return;

    // 2. If it's a folder, we need to handle it recursively. 
    // For simplicity, we'll let the mutation handle the DB part and recursive Convex storage deletion,
    // but R2 deletion needs to be handled here.
    
    const deleteRecursiveR2 = async (fileId: any) => {
      const children = await ctx.runQuery(api.files.getChildren, { sessionToken, folderId: fileId });
      for (const child of children) {
        if (child.type === "folder") await deleteRecursiveR2(child._id);
        if (child.r2Key) {
          await ctx.runAction(api.r2.deleteObject, { sessionToken, key: child.r2Key });
        }
      }
    };

    if (file.type === "folder") await deleteRecursiveR2(id);
    if (file.r2Key) {
      await ctx.runAction(api.r2.deleteObject, { sessionToken, key: file.r2Key });
    }

    // 3. Call the mutation to delete from DB and Convex storage
    await ctx.runMutation(api.files.remove, { sessionToken, id });
  },
});

export const removeFiles = action({
  args: { sessionToken: v.string(), ids: v.array(v.id("files")) },
  handler: async (ctx, { sessionToken, ids }) => {
    await getAuthedUserId(ctx, sessionToken);
    for (const id of ids) {
      await ctx.runAction(api.r2.removeFile, { sessionToken, id });
    }
  },
});

export const migrateFilesToR2 = action({
  args: { sessionToken: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { sessionToken, limit }) => {
    if (sessionToken) {
      await getAuthedUserId(ctx, sessionToken);
    }
    
    // 1. Get a small list of files to migrate
    const files = await ctx.runQuery(api.files.listAllWithStorage, { sessionToken, limit: limit ?? 1 });
    const client = getS3Client();
    let migratedCount = 0;

    for (const file of files) {
      if (!file.storageId) continue;
      
      // Skip files that are too large for Convex's 64MB memory limit
      if (file.size && file.size > 40 * 1024 * 1024) {
        console.warn(`Skipping ${file.name}: File is too large for migration script (>40MB)`);
        continue;
      }
      
      try {
        const url = await ctx.runQuery(api.files.getStorageUrl, { storageId: file.storageId });
        if (!url) continue;
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Use Uint8Array instead of Buffer
        const body = new Uint8Array(arrayBuffer);
        
        const r2Key = `migrated-${file._id}-${file.name}`;
        await client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: body,
          ContentType: file.category === 'image' ? 'image/jpeg' : 'application/octet-stream',
        }));
        
        await ctx.runMutation(api.files.updateStorageToR2, { 
          sessionToken, 
          id: file._id, 
          r2Key 
        });
        
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate file ${file.name}:`, error);
      }
    }
    
    return { migratedCount };
  },
});
