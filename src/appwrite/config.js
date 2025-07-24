import conf from '../conf/conf.js';
import { Client, ID, Databases, Storage, Query } from 'appwrite';

export class Service {
  client = new Client();
  databases;
  bucket;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);

    this.databases = new Databases(this.client);
    this.bucket = new Storage(this.client);
  }

  // ✅ Create Post
  async createPost({ title, slug, content, featuredImage, status, userId }) {
    try {
      const payload = {
        title,
        content,
        status,
        userId,
      };

      if (featuredImage) {
        payload.featuredImage = featuredImage;
      }

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        slug,
        payload
      );
    } catch (error) {
      console.error('Appwrite service :: createPost :: error', error);
      return false;
    }
  }

  // ✅ Update Post
  async updatePost(slug, { title, content, featuredImage, status }) {
    try {
      const payload = {
        title,
        content,
        status,
      };

      // Only include featuredImage if provided
      if (featuredImage) {
        payload.featuredImage = featuredImage;
      }
      else{
        payload.featuredImage = ""; // Clear if not provided
      }

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        slug,
        payload
      );
    } catch (error) {
      console.error('Appwrite service :: updatePost :: error', error);
      return false;
    }
  }

  // ✅ Delete Post
  async deletePost(slug, featuredImageId = null) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        slug
      );

      // Only delete file if an image exists
      if (featuredImageId) {
        await this.deleteFile(featuredImageId);
      }

      return true;
    } catch (error) {
      console.error('Appwrite service :: deletePost :: error', error);
      return false;
    }
  }

  // ✅ Get a single Post
  async getPost(slug) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        slug
      );
    } catch (error) {
      console.error('Appwrite service :: getPost :: error', error);
      return null;
    }
  }

  // ✅ Get multiple Posts
  async getPosts(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        queries
      );
    } catch (error) {
      console.error('Appwrite service :: getPosts :: error', error);
      return { documents: [] };
    }
  }

  // ✅ File upload
  async uploadFile(file) {
    try {
      return await this.bucket.createFile(
        conf.appwriteBucketId,
        ID.unique(),
        file
      );
    } catch (error) {
      console.error('Appwrite service :: uploadFile :: error', error);
      return null;
    }
  }

  // ✅ File delete
  async deleteFile(fileId) {
    if (!fileId) return false; // nothing to delete
    try {
      await this.bucket.deleteFile(conf.appwriteBucketId, fileId);
      return true;
    } catch (error) {
      console.error('Appwrite service :: deleteFile :: error', error);
      return false;
    }
  }

  // ✅ File preview
  getFileView(fileId) {
  if (!fileId) return '';
  return this.bucket.getFileView(conf.appwriteBucketId, fileId);
}
}

// Export singleton
const service = new Service();
export default service;
