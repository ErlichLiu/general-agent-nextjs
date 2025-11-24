import FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import type {
  OSSConfig,
  AuthInfo,
  OSSUploadConfig,
  ResourceInfo,
  UploadResult,
  FrontendConfig,
} from '@/app/types/oss';

export class OSSService {
  private _config?: OSSConfig;

  private get config(): OSSConfig {
    if (!this._config) {
      this._config = {
        username: process.env.TUOTU_USERNAME || '',
        password: process.env.TUOTU_PASSWORD || '',
        uid: process.env.TUOTU_UID || '',
        fieldName: process.env.TUOTU_FIELD_NAME || '',
        formHeadUuid: process.env.TUOTU_FORM_HEAD_UUID || '',
        apiHost: process.env.TUOTU_API_HOST || 'api.ontuotu.com',
        apiOrigin: process.env.TUOTU_API_ORIGIN || 'https://paas.ontuotu.com',
      };
    }
    return this._config;
  }

  // 步骤0: 登录获取认证信息
  async login(): Promise<AuthInfo> {
    const loginUrl = `https://${this.config.apiHost}/api/platform/auth/login`;
    const loginPayload = {
      username: this.config.username,
      password: this.config.password,
    };

    console.log('🔗 登录地址:', loginUrl);
    console.log('📦 请求数据:', JSON.stringify(loginPayload, null, 2));

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload),
    });

    console.log('📡 响应状态:', response.status, response.statusText);

    const result = await response.json() as any;
    console.log('📄 响应数据:', JSON.stringify(result, null, 2));

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      // 格式1: { status: "success", result: { token: "..." } }
      return {
        token: result.result.token,
        cookie: response.headers.get('set-cookie') || '',
      };
    } else if (result.code === 200 && result.data) {
      // 格式2: { code: 200, data: { token: "..." } }
      return {
        token: result.data.token,
        cookie: response.headers.get('set-cookie') || '',
      };
    } else {
      throw new Error(`登录失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  // 步骤1: 获取OSS配置
  async getOSSConfig(authInfo: AuthInfo): Promise<OSSUploadConfig> {
    const ossConfigUrl = `https://${this.config.apiHost}/api/general/oss/config`;
    console.log('🔗 获取OSS配置地址:', ossConfigUrl);

    const response = await fetch(ossConfigUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
      },
    });

    console.log('📡 响应状态:', response.status, response.statusText);

    const result = await response.json() as any;
    console.log('📄 响应数据:', JSON.stringify(result, null, 2));

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      // 格式1: { status: "success", result: { ... } }
      return result.result;
    } else if (result.code === 200 && result.data) {
      // 格式2: { code: 200, data: { ... } }
      return result.data;
    } else {
      throw new Error(`获取OSS配置失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  // 步骤2: 上传文件到OSS
  async uploadFileToOSS(
    filePath: string,
    ossConfig: OSSUploadConfig
  ): Promise<{ keyValue: string; fileUrl: string }> {
    const fileName = path.basename(filePath);
    const keyValue = `${ossConfig.dir}${Date.now()}_${fileName}`;

    console.log('📦 准备上传文件:', fileName);
    console.log('🔑 OSS Key:', keyValue);

    const formData = new FormData();
    formData.append('key', keyValue);
    formData.append('policy', ossConfig.policy);
    formData.append('OSSAccessKeyId', ossConfig.accessid);
    formData.append('signature', ossConfig.signature);
    formData.append('success_action_status', '200');
    formData.append('file', fs.createReadStream(filePath), fileName);

    console.log('🔗 上传目标:', ossConfig.host);

    try {
      const response = await axios.post(ossConfig.host, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log('📡 上传响应状态:', response.status, response.statusText);
      console.log('✅ 文件上传成功');

      return {
        keyValue,
        fileUrl: `${ossConfig.host}${keyValue}`,
      };
    } catch (error: any) {
      console.log('❌ 上传错误:', error.response?.status, error.response?.statusText);
      if (error.response?.data) {
        console.log('❌ 错误详情:', error.response.data);
      }
      throw new Error(`OSS上传失败: ${error.message}`);
    }
  }

  // 步骤3: 创建资源记录
  async createResource(
    fileName: string,
    keyValue: string,
    authInfo: AuthInfo
  ): Promise<string> {
    const response = await fetch(`https://${this.config.apiHost}/api/general/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
      },
      body: JSON.stringify({
        name: fileName,
        path: keyValue,
        type: 'file',
      }),
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success' && result.result) {
      return result.result.id;
    } else if (result.code === 200 && result.data) {
      return result.data.id;
    } else {
      throw new Error(`创建资源失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  // 步骤4: 创建表单数据（关联项目）
  async createFormData(
    resourceIds: string[],
    fieldName: string,
    formHeadUuid: string,
    formData: Record<string, string>,
    authInfo: AuthInfo
  ): Promise<void> {
    const payload = {
      formHeadUuid,
      data: {
        ...formData,
        [fieldName]: resourceIds, // 附件字段关联所有资源ID
      },
    };

    const response = await fetch(`https://${this.config.apiHost}/api/platform/forms/online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.token}`,
        Cookie: authInfo.cookie,
        Origin: this.config.apiOrigin,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as any;

    // 支持两种响应格式
    if (result.status === 'success') {
      return;
    } else if (result.code === 200) {
      return;
    } else {
      throw new Error(`创建表单失败: ${result.err_msg || result.message || JSON.stringify(result)}`);
    }
  }

  // 主方法: 一键上传报告并关联项目
  async uploadReportComplete(
    taskId: string,
    outputDirectory: string,
    frontendConfig: FrontendConfig
  ): Promise<UploadResult> {
    console.log('📤 [OSS_UPLOAD_START] 开始上传报告到拖兔平台...');

    // 步骤0: 登录
    const authInfo = await this.login();
    console.log('✅ 登录成功');

    // 步骤1: 获取OSS配置
    const ossConfig = await this.getOSSConfig(authInfo);
    console.log('✅ 获取OSS配置成功');

    // 查找需要上传的文件
    const files = this.findReportFiles(outputDirectory);
    const resourceList: ResourceInfo[] = [];
    const uploadResults: any[] = [];
    let totalSize = 0;

    // 步骤2-3: 批量上传文件并创建资源
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      totalSize += fileSize;

      // 上传到OSS
      const { keyValue, fileUrl } = await this.uploadFileToOSS(filePath, ossConfig);
      console.log(`✅ 上传成功: ${fileName}`);

      // 创建资源记录
      const resourceId = await this.createResource(fileName, keyValue, authInfo);
      console.log(`✅ 创建资源: ${resourceId}`);

      resourceList.push({
        id: resourceId,
        name: fileName,
        url: fileUrl,
        size: fileSize,
      });

      uploadResults.push({ fileName, resourceId, fileUrl });
    }

    // 步骤4: 创建表单数据（关联项目）
    const formData = {
      xxiutkzluajtoljp: frontendConfig.queryId,       // 企业ID
      uxxcnibliesxqhkl: frontendConfig.requirementId, // 需求单ID
      kstiuvzjeojljshp: taskId,                       // 任务ID
    };

    console.log('📝 表单关联数据:', formData);

    await this.createFormData(
      resourceList.map(r => r.id),
      this.config.fieldName,
      this.config.formHeadUuid,
      formData,
      authInfo
    );

    console.log(`✅ [OSS_UPLOAD_COMPLETE] 上传完成: ${resourceList.length} 个文件`);

    const primaryReport = resourceList[0];
    return {
      success: true,
      taskId,
      uploadedFiles: resourceList.length,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      primaryReport: {
        name: primaryReport.name,
        size: primaryReport.size,
        sizeFormatted: this.formatFileSize(primaryReport.size),
      },
      resources: resourceList,
      uploadDetails: uploadResults,
    };
  }

  private findReportFiles(directory: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && (item.endsWith('.docx') || item.endsWith('.md'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// 导出单例
export const ossService = new OSSService();
