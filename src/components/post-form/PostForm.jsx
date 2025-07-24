import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
  const { register, handleSubmit, watch, setValue, control, getValues } =
    useForm({
      defaultValues: {
        title: post?.title || "",
        slug: post?.$id || "",
        content: post?.content || "",
        status: post?.status || "active",
      },
    });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);

  // ✅ Local state for file and removal flag
  const [selectedFile, setSelectedFile] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // When a new file is selected
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRemoveExistingImage(false); // if user selects new image, cancel removal
    }
  };

  // Remove selected new file
  const handleRemoveNewFile = () => {
    setSelectedFile(null);
    document.getElementById("featuredImageInput").value = "";
  };

  // Mark existing image for removal
  const handleRemoveExisting = () => {
    setRemoveExistingImage(true);
    setSelectedFile(null);
    document.getElementById("featuredImageInput").value = "";
  };

  const submit = async (data) => {
    if (!userData || !userData.$id) {
      console.error("User data not available");
      return;
    }

    let featuredImageId = post?.featuredImage || ""; // current image id

    if (post) {
      // case 1: user picked a new file
      if (selectedFile) {
        const file = await appwriteService.uploadFile(selectedFile);
        if (file) {
          // delete old image if exists
          if (post.featuredImage) {
            try {
              await appwriteService.deleteFile(post.featuredImage);
            } catch (err) {
              console.warn("Old image not found (already deleted?)", err);
            }
          }
          featuredImageId = file.$id;
        }
      }
      // case 2: user removed existing image without selecting new
      else if (removeExistingImage && post.featuredImage) {
        try {
          await appwriteService.deleteFile(post.featuredImage);
        } catch (err) {
          console.warn("Image already deleted or not found in storage", err);
        }
        featuredImageId = ""; // 🔥 very important: clear in DB
      }

      // update the database post
      const payload = {
        title: data.title,
        content: data.content,
        status: data.status,
        featuredImage: featuredImageId, // 🔥 now reflects removal or new image
      };

      const dbPost = await appwriteService.updatePost(post.$id, payload);
      if (dbPost) navigate(`/post/${dbPost.$id}`);
    } else {
      // creating a new post
      let newImageId = "";
      if (selectedFile) {
        const file = await appwriteService.uploadFile(selectedFile);
        if (file) newImageId = file.$id;
      }

      const dbPost = await appwriteService.createPost({
        ...data,
        featuredImage: newImageId,
        userId: userData.$id,
      });
      if (dbPost) navigate(`/post/${dbPost.$id}`);
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string")
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]+/g, "-")
        .replace(/\s/g, "-");
    return "";
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input
          label="Title :"
          placeholder="Title"
          className="mb-4"
          {...register("title", { required: true })}
        />
        <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4"
          {...register("slug", { required: true })}
          onInput={(e) => {
            setValue("slug", slugTransform(e.currentTarget.value), {
              shouldValidate: true,
            });
          }}
        />
        <RTE
          label="Content :"
          name="content"
          control={control}
          defaultValue={getValues("content")}
        />
      </div>

      <div className="w-1/3 px-2">
        <label className="inline-block mb-1 pl-1">Featured Image :</label>
        <input
          id="featuredImageInput"
          type="file"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          className="mb-2 block"
          onChange={handleFileChange}
        />

        {/* If new file selected */}
        {selectedFile && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">
              Selected: {selectedFile.name}
            </p>
            <Button
              type="button"
              bgColor="bg-red-500"
              onClick={handleRemoveNewFile}
            >
              Remove Selected File
            </Button>
          </div>
        )}

        {/* If editing and existing image is present, show preview and option to remove */}
        {!selectedFile && post?.featuredImage && !removeExistingImage && (
          <div className="mb-4">
            <img
              src={appwriteService.getFileView(post.featuredImage)}
              alt={post.title}
              className="rounded-lg mb-2"
            />
            <Button
              type="button"
              bgColor="bg-red-500"
              onClick={handleRemoveExisting}
            >
              Remove Existing Image
            </Button>
          </div>
        )}

        {/* Show note if existing image is marked for removal */}
        {removeExistingImage && (
          <p className="text-sm text-red-600 mb-4">
            Existing image will be removed.
          </p>
        )}

        <Select
          options={["active", "inactive"]}
          label="Status"
          className="mb-4"
          {...register("status", { required: true })}
        />
        <Button
          type="submit"
          bgColor={post ? "bg-green-500" : undefined}
          className="w-full"
        >
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
