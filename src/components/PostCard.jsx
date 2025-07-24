import React from 'react'
import appwriteService from "../appwrite/config"
import {Link} from 'react-router-dom'

function PostCard({ $id, title, featuredImage }) {
  const hasImage = featuredImage && featuredImage.trim() !== "";
  console.log('PostCard featuredImage value:', featuredImage, typeof featuredImage);

  return (
    <Link to={`/post/${$id}`}>
      <div className="w-full bg-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
        {hasImage && (
          <div className="w-full justify-center mb-4">
            <img
              src={appwriteService.getFileView(featuredImage)}
              alt={title}
              className="rounded-xl w-full h-48 object-cover"
            />
          </div>
        )}
        <h2 className="text-xl font-bold truncate">{title}</h2>
      </div>
    </Link>
  );
}



export default PostCard