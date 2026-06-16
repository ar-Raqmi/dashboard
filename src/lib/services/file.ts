import { BaseService } from './base'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'


export class FileService extends BaseService {
  private getS3Client() {
    const accessKeyId =
      this.env?.R2_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY_ID ||
      process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID
    const secretAccessKey =
      this.env?.R2_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY
    const endpoint =
      this.env?.R2_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      process.env.NEXT_PUBLIC_R2_ENDPOINT ||
      'https://1253834dc9cac8e48edc6a7fec740ac9.r2.cloudflarestorage.com'

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      return null
    }

    return new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  private async getFilesToDelete(userId: string, id: string): Promise<any[]> {
    const file = await this.db.fileItem.findUnique({
      where: { id },
      include: { children: true },
    })
    if (!file || file.userId !== userId) return []

    let results = [file]
    if (file.type === 'folder') {
      for (const child of file.children) {
        const childResults = await this.getFilesToDelete(userId, child.id)
        results = results.concat(childResults)
      }
    }
    return results
  }

  async list(args: {
    sessionToken: string
    parentId?: string | null
    starred?: boolean
    category?: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { parentId, starred, category } = args

    const whereClause: any = { userId: user.id }
    if (starred !== undefined) {
      whereClause.starred = starred
    } else if (category !== undefined) {
      whereClause.category = category
    } else {
      whereClause.parentId = parentId || null
    }

    const files = await this.db.fileItem.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    })

    return files.map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      category: f.category || undefined,
      parentId: f.parentId || null,
      size: f.size || 0,
      storageId: f.storageId || undefined,
      r2Key: f.r2Key || undefined,
      storageSource: f.storageSource || undefined,
      starred: f.starred || false,
      lastAccessed: f.lastAccessed || undefined,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  }

  async getPath(args: { sessionToken: string; folderId?: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { folderId } = args
    if (!folderId) return []

    const path = []
    let currentId: string | null = folderId
    while (currentId) {
      const folder = await this.db.fileItem.findUnique({
        where: { id: currentId },
      })
      if (!folder || folder.userId !== user.id) break
      path.unshift({
        id: folder.id,
        name: folder.name,
      })
      currentId = folder.parentId
    }
    return path
  }

  async listAll(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const files = await this.db.fileItem.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
    return files.map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      category: f.category || undefined,
      parentId: f.parentId || null,
      size: f.size || 0,
      storageId: f.storageId || undefined,
      r2Key: f.r2Key || undefined,
      storageSource: f.storageSource || undefined,
      starred: f.starred || false,
      lastAccessed: f.lastAccessed || undefined,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  }

  async create(args: {
    sessionToken: string
    name: string
    type: string
    category?: string
    parentId?: string | null
    size?: number
    storageId?: string
    r2Key?: string
    storageSource?: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { name, type, category, parentId, size, storageId, r2Key, storageSource } = args
    const f = await this.db.fileItem.create({
      data: {
        userId: user.id,
        name,
        type,
        category: category || null,
        parentId: parentId || null,
        size: size || null,
        storageId: storageId || null,
        r2Key: r2Key || null,
        storageSource: storageSource || (storageId ? 'legacy' : r2Key ? 'r2' : null),
        updatedAt: new Date(),
      },
    })
    return f.id
  }

  async rename(args: { sessionToken: string; id?: string; fileId?: string; name: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const id = args.id || args.fileId
    const { name } = args
    if (!id) throw new Error('Missing file id')
    const file = await this.db.fileItem.findUnique({ where: { id } })
    if (!file || file.userId !== user.id) {
      throw new Error('File not found or unauthorized')
    }
    await this.db.fileItem.update({
      where: { id },
      data: { name },
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; id?: string; fileId?: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const id = args.id || args.fileId
    if (!id) throw new Error('Missing file id')
    const file = await this.db.fileItem.findUnique({ where: { id } })
    if (!file || file.userId !== user.id) {
      throw new Error('File not found or unauthorized')
    }
    const filesToDelete = await this.getFilesToDelete(user.id, id)
    const s3 = this.getS3Client()
    for (const f of filesToDelete) {
      if (f.r2Key) {
        if (s3) {
          try {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: this.env?.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dashboard-files',
                Key: f.r2Key,
              })
            )
          } catch (err) {
            console.error(`Failed to delete ${f.r2Key} from R2:`, err)
          }
        } else {
          try {
            const proc = (globalThis as any).process
            if (proc && proc.cwd) {
              const getModule = (name: string) =>
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                typeof require !== 'undefined' ? require(name) : null
              const fs = getModule('fs')
              const pathModule = getModule('path')
              if (fs && pathModule) {
                const filePath = pathModule.join(proc.cwd(), 'public', 'uploads', f.r2Key)
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath)
                }
              }
            }
          } catch (err) {
            console.error(`Failed to delete local file ${f.r2Key}:`, err)
          }
        }
      }
    }
    await this.db.fileItem.delete({ where: { id } })
    return { success: true }
  }

  async move(args: {
    sessionToken: string
    fileId?: string
    id?: string
    newParentId?: string | null
    targetFolderId?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const fileId = args.fileId || args.id
    const newParentId = args.newParentId !== undefined ? args.newParentId : args.targetFolderId
    if (!fileId) throw new Error('Missing fileId')
    const file = await this.db.fileItem.findUnique({ where: { id: fileId } })
    if (!file || file.userId !== user.id) {
      throw new Error('File not found or unauthorized')
    }

    // Prevent cyclic moves for folders
    if (newParentId) {
      let current: any = newParentId
      let isCyclic = false
      while (current) {
        if (current === fileId) {
          isCyclic = true
          break
        }
        const parent = await this.db.fileItem.findUnique({ where: { id: current } })
        current = parent?.parentId
      }
      if (isCyclic) throw new Error('Cannot move folder inside itself or its children')
    }

    await this.db.fileItem.update({
      where: { id: fileId },
      data: { parentId: newParentId || null },
    })
    return { success: true }
  }

  async moveFiles(args: {
    sessionToken: string
    ids: string[]
    newParentId?: string | null
    targetFolderId?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { ids } = args
    const newParentId = args.newParentId !== undefined ? args.newParentId : args.targetFolderId

    for (const id of ids) {
      const file = await this.db.fileItem.findUnique({ where: { id } })
      if (!file || file.userId !== user.id) continue

      // Prevent cyclic moves for folders
      if (newParentId) {
        let current: any = newParentId
        let isCyclic = false
        while (current) {
          if (current === id) {
            isCyclic = true
            break
          }
          const parent = await this.db.fileItem.findUnique({ where: { id: current } })
          current = parent?.parentId
        }
        if (isCyclic) continue
      }

      await this.db.fileItem.update({
        where: { id },
        data: { parentId: newParentId || null },
      })
    }
    return { success: true }
  }

  async toggleStar(args: { sessionToken: string; id: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { id } = args
    const file = await this.db.fileItem.findUnique({ where: { id } })
    if (!file || file.userId !== user.id) {
      throw new Error('File not found or unauthorized')
    }
    const updated = await this.db.fileItem.update({
      where: { id },
      data: { starred: !file.starred },
    })
    return { success: true, starred: updated.starred }
  }

  async getFileUrl(args: { sessionToken: string; storageId?: string; r2Key?: string; filename?: string }) {
    await this.getAuthedUser(args.sessionToken)
    const { storageId, r2Key, filename } = args

    if (storageId) {
      return `/api/storage/${storageId}`
    }

    if (r2Key) {
      const s3 = this.getS3Client()
      if (s3) {
        try {
          const cleanFilename = filename ? filename.replace(/["\\]/g, '') : undefined
          const contentDisposition = cleanFilename
            ? `attachment; filename="${cleanFilename}"`
            : undefined

          const command = new GetObjectCommand({
            Bucket: this.env?.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dashboard-files',
            Key: r2Key,
            ResponseContentDisposition: contentDisposition,
          })
          const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
          return signedUrl
        } catch (err) {
          console.error('Failed to generate signed GET URL:', err)
        }
      }

      return `/api/storage/proxy?key=${encodeURIComponent(r2Key)}&token=${encodeURIComponent(
        args.sessionToken
      )}`
    }

    return null
  }

  async getUploadUrl(args: { sessionToken: string; key: string; contentType?: string }) {
    await this.getAuthedUser(args.sessionToken)
    const { key, contentType } = args
    const s3 = this.getS3Client()
    if (s3) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.env?.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dashboard-files',
          Key: key,
          ContentType: contentType,
        })
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
        return url
      } catch (err) {
        console.error('Failed to generate R2 signed url:', err)
      }
    }
    return `/api/storage/local-upload?key=${encodeURIComponent(key)}`
  }

  async removeFile(args: { sessionToken: string; id?: string; fileId?: string }) {
    return this.remove(args)
  }

  async removeFiles(args: { sessionToken: string; ids: string[] }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { ids } = args
    if (!ids || !Array.isArray(ids)) throw new Error('Missing ids array')
    const s3 = this.getS3Client()
    for (const id of ids) {
      const filesToDelete = await this.getFilesToDelete(user.id, id)
      for (const f of filesToDelete) {
        if (f.r2Key) {
          if (s3) {
            try {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: this.env?.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dashboard-files',
                  Key: f.r2Key,
                })
              )
            } catch (err) {
              console.error(`Failed to delete ${f.r2Key} from R2:`, err)
            }
          } else {
            console.warn(`Skipping local file delete for ${f.r2Key} (edge runtime)`)
          }
        }
      }
      await this.db.fileItem.delete({ where: { id } })
    }
    return { success: true }
  }
}
