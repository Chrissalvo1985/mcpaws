import { RDSDataClient, ExecuteStatementCommand, BatchExecuteStatementCommand } from "@aws-sdk/client-rds-data";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand } from "@aws-sdk/client-rds";

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  clusterArn?: string;
  secretArn?: string;
  database?: string;
}

export class AWSDatabaseCore {
  private rdsDataClient: RDSDataClient;
  private rdsClient: RDSClient;
  private config: AWSConfig;

  constructor(config: AWSConfig) {
    this.config = config;

    this.rdsDataClient = new RDSDataClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.rdsClient = new RDSClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async executeSql(sql: string, parameters: any[] = []) {
    if (!this.config.clusterArn || !this.config.secretArn) {
      throw new Error("DB_CLUSTER_ARN and DB_SECRET_ARN required for Data API");
    }

    const command = new ExecuteStatementCommand({
      resourceArn: this.config.clusterArn,
      secretArn: this.config.secretArn,
      database: this.config.database || "postgres",
      sql,
      parameters,
      includeResultMetadata: true,
    });

    const response = await this.rdsDataClient.send(command);

    return {
      numberOfRecordsUpdated: response.numberOfRecordsUpdated,
      records: response.records,
      columnMetadata: response.columnMetadata?.map((col) => ({
        name: col.name,
        type: col.typeName,
        nullable: col.nullable,
        precision: col.precision,
      })),
      generatedFields: response.generatedFields,
    };
  }

  async batchExecuteSql(sql: string, parameterSets: any[][]) {
    if (!this.config.clusterArn || !this.config.secretArn) {
      throw new Error("DB_CLUSTER_ARN and DB_SECRET_ARN required");
    }

    const command = new BatchExecuteStatementCommand({
      resourceArn: this.config.clusterArn,
      secretArn: this.config.secretArn,
      database: this.config.database || "postgres",
      sql,
      parameterSets,
    });

    const response = await this.rdsDataClient.send(command);

    return {
      updateResults: response.updateResults,
    };
  }

  async listDbInstances() {
    const command = new DescribeDBInstancesCommand({});
    const response = await this.rdsClient.send(command);

    return response.DBInstances?.map((instance) => ({
      identifier: instance.DBInstanceIdentifier,
      engine: instance.Engine,
      engineVersion: instance.EngineVersion,
      status: instance.DBInstanceStatus,
      endpoint: instance.Endpoint?.Address,
      port: instance.Endpoint?.Port,
      availabilityZone: instance.AvailabilityZone,
      instanceClass: instance.DBInstanceClass,
      storageType: instance.StorageType,
      allocatedStorage: instance.AllocatedStorage,
      multiAZ: instance.MultiAZ,
    })) || [];
  }

  async listDbClusters() {
    const command = new DescribeDBClustersCommand({});
    const response = await this.rdsClient.send(command);

    return response.DBClusters?.map((cluster) => ({
      identifier: cluster.DBClusterIdentifier,
      arn: cluster.DBClusterArn,
      engine: cluster.Engine,
      engineVersion: cluster.EngineVersion,
      status: cluster.Status,
      endpoint: cluster.Endpoint,
      readerEndpoint: cluster.ReaderEndpoint,
      port: cluster.Port,
      databaseName: cluster.DatabaseName,
      members: cluster.DBClusterMembers?.map((m) => m.DBInstanceIdentifier),
      serverlessV2: cluster.ServerlessV2ScalingConfiguration,
    })) || [];
  }

  async describeDbInstance(instanceIdentifier: string) {
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: instanceIdentifier,
    });

    const response = await this.rdsClient.send(command);
    const instance = response.DBInstances?.[0];

    if (!instance) {
      throw new Error(`Instance ${instanceIdentifier} not found`);
    }

    return {
      identifier: instance.DBInstanceIdentifier,
      arn: instance.DBInstanceArn,
      engine: instance.Engine,
      engineVersion: instance.EngineVersion,
      status: instance.DBInstanceStatus,
      endpoint: {
        address: instance.Endpoint?.Address,
        port: instance.Endpoint?.Port,
      },
      instanceClass: instance.DBInstanceClass,
      storageType: instance.StorageType,
      allocatedStorage: instance.AllocatedStorage,
      vpcSecurityGroups: instance.VpcSecurityGroups,
      availabilityZone: instance.AvailabilityZone,
      multiAZ: instance.MultiAZ,
      publiclyAccessible: instance.PubliclyAccessible,
      backupRetentionPeriod: instance.BackupRetentionPeriod,
    };
  }
}

