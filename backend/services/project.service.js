import mongoose from "mongoose";
import projectModel from "../models/project.model.js";


export const createProject = async({
    name,userId
    }) =>{
    if(!name || !userId){
        throw new Error('All feid are required')
    }

    const project = await projectModel.create({
        name,
        users:[userId]
    })

    return project;
}

export const getAllProjectByUserId = async({
    userId
}) =>{
    if(!userId){
        throw new Error('UserId is required')
    }

    const allUserProject = await projectModel.find({
        users:userId
    })

    return allUserProject;
}

export const addUserToProject = async ({ projectId, users, userId }) => {
    // Validate projectId
    if (!projectId) {
        throw new Error("ProjectId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid ProjectId");
    }

    // Validate requesting user
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId");
    }

    // Validate users array
    if (!Array.isArray(users) || users.length === 0) {
        throw new Error("Users must be a non-empty array");
    }

    if (
        users.some(
            id => typeof id !== "string" ||
            !mongoose.Types.ObjectId.isValid(id)
        )
    ) {
        throw new Error("Invalid userId(s) in users array");
    }

    // Check whether the requesting user belongs to the project
    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    });

    if (!project) {
        throw new Error("User does not belong to this project");
    }

    // Add users without creating duplicates
    const updatedProject = await projectModel.findByIdAndUpdate(
        projectId,
        {
            $addToSet: {
                users: {
                    $each: users.map(id => new mongoose.Types.ObjectId(id))
                }
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedProject) {
        throw new Error("Project not found");
    }

    return updatedProject;
};


export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid ProjectId");
    }

    const project = await projectModel
        .findById(projectId)
        .populate("users", "email");

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};

export const updateFileTree = async ({projectId,fileTree}) => {
    if(!projectId){
        throw new Error("ProjectId is require")
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error("ProjectId is require")
    }

    if(!fileTree){
        throw new Error("fileTree is required")
    }
    const project = await projectModel.findOneAndUpdate({
        _id:projectId
    },{
        fileTree
    },{
        new:tree
    })
    return project;
}