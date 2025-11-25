import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

class FileService {
  constructor() {
    this.tableName = 'files_c';
  }

  async getAll() {
    try {
      const apperClient = getApperClient();
      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "Tags"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching files:", error?.response?.data?.message || error);
      toast.error("Failed to load files");
      return [];
    }
  }

  async getFilesByTaskId(taskId) {
    try {
      const apperClient = getApperClient();
      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "Tags"}}
        ],
        where: [
          {
            "FieldName": "task_c",
            "Operator": "EqualTo",
            "Values": [parseInt(taskId)],
            "Include": true
          }
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error(`Error fetching files for task ${taskId}:`, error?.response?.data?.message || error);
      return [];
    }
  }

  async create(fileData, uploadedFiles = []) {
    try {
      const records = uploadedFiles.map(file => ({
        Name: file.name || fileData.Name,
        file_name_c: file.name || fileData.file_name_c,
        file_data_c: window.ApperSDK.ApperFileUploader.toCreateFormat(file),
        task_c: parseInt(fileData.task_c),
        Tags: fileData.Tags || ""
      }));

      if (records.length === 0) {
        return [];
      }

      const apperClient = getApperClient();
      const params = {
        records: records
      };

      const response = await apperClient.createRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} files: ${JSON.stringify(failed)}`);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          toast.success(`Successfully uploaded ${successful.length} file(s)`);
        }

        return successful.map(r => r.data);
      }

      return [];
    } catch (error) {
      console.error("Error creating files:", error?.response?.data?.message || error);
      toast.error("Failed to upload files");
      return [];
    }
  }

  async delete(recordId) {
    try {
      const apperClient = getApperClient();
      const params = {
        RecordIds: [parseInt(recordId)]
      };

      const response = await apperClient.deleteRecord(this.tableName, params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      toast.success("File deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting file:", error?.response?.data?.message || error);
      toast.error("Failed to delete file");
      return false;
    }
  }
}

export const fileService = new FileService();