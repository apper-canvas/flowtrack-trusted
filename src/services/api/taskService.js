import { toast } from "react-toastify";
import React from "react";
import { getApperClient } from "@/services/apperClient";

const tableName = "tasks_c";

export const taskService = {
  async getAll() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "created_at_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await apperClient.fetchRecords(tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      // Handle empty or non-existent data
      if (!response?.data?.length) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "created_at_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "Tags"}}
        ]
      };

      const response = await apperClient.getRecordById(tableName, parseInt(id), params);

      if (!response?.data) {
        throw new Error(`Task with Id ${id} not found`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error);
      throw error;
    }
  },

async create(taskData, uploadedFiles = []) {
    try {
      const apperClient = getApperClient();
      
      // Filter out any fields that shouldn't be sent
      const filteredData = {};
      const updateableFields = ['title_c', 'description_c', 'priority_c', 'status_c', 'created_at_c', 'completed_at_c', 'Tags'];
      
      updateableFields.forEach(field => {
        if (taskData[field] !== undefined && taskData[field] !== null && taskData[field] !== '') {
          filteredData[field] = taskData[field];
        }
      });
      
      // Set Name field to the same as title for consistency
      if (filteredData.title_c) filteredData.Name = filteredData.title_c;

      const params = {
        records: [filteredData]
      };

const response = await apperClient.createRecord(tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      let createdTask = null;
      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to create task: ${JSON.stringify(failed)}`);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
          return null;
        }

        if (successful.length > 0) {
          createdTask = successful[0].data;
          toast.success("Task created successfully");
          
          // Handle file uploads if provided
          if (uploadedFiles && uploadedFiles.length > 0 && createdTask) {
            const { fileService } = await import("./fileService");
            await fileService.create({
              Name: createdTask.title_c || 'Task File',
              task_c: createdTask.Id
            }, uploadedFiles);
          }
        }
      }

      return createdTask;
    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error);
      toast.error("Failed to create task");
      return null;
    }
},

  async getTasksWithFiles() {
    try {
      const apperClient = getApperClient();
      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "created_at_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

const response = await apperClient.fetchRecords(tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      const tasks = response.data || [];

      // Get files for each task
      const { fileService } = await import("./fileService");
      const tasksWithFiles = await Promise.all(
        tasks.map(async (task) => {
          const files = await fileService.getFilesByTaskId(task.Id);
          return {
            ...task,
            attachedFiles: files
          };
        })
      );

      return tasksWithFiles;
    } catch (error) {
      console.error("Error fetching tasks with files:", error?.response?.data?.message || error);
      return [];
    }
},

  async update(id, updates) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      // Map UI updates to database fields (only Updateable fields)
      const recordData = {
        Id: parseInt(id)
      };

      // Map field names properly
      if (updates.title !== undefined) recordData.title_c = updates.title;
      if (updates.description !== undefined) recordData.description_c = updates.description;
      if (updates.priority !== undefined) recordData.priority_c = updates.priority;
      if (updates.status !== undefined) recordData.status_c = updates.status;
      if (updates.completedAt !== undefined) recordData.completed_at_c = updates.completedAt;

      // Direct database field updates
      if (updates.title_c !== undefined) recordData.title_c = updates.title_c;
      if (updates.description_c !== undefined) recordData.description_c = updates.description_c;
      if (updates.priority_c !== undefined) recordData.priority_c = updates.priority_c;
      if (updates.status_c !== undefined) recordData.status_c = updates.status_c;
      if (updates.completed_at_c !== undefined) recordData.completed_at_c = updates.completed_at_c;

      // Update Name field when title changes
      if (recordData.title_c) {
        recordData.Name = recordData.title_c;
      }

      // Filter out undefined/null values (except for explicit nulls to clear fields)
      const filteredData = Object.fromEntries(
        Object.entries(recordData).filter(([key, value]) => value !== undefined && (value !== "" || value === null))
      );

      const params = {
        records: [filteredData]
      };

      const response = await apperClient.updateRecord(tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        return successful.length > 0 ? successful[0].data : null;
      }

      return null;
    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord(tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        return successful.length > 0;
      }

      return true;
    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error);
      throw error;
    }
  }
};