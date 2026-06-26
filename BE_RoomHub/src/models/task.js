import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: false,
        },
        responsibleBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        details: {
            type: String,
            default: '',
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['In Progress', 'Completed', 'Cancelled'],
            default: 'In Progress',
        },
        dueDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Task = mongoose.model('Task', TaskSchema);
export default Task;
