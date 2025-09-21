const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('正在测试Prisma数据库连接...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ Prisma连接成功');
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ 数据库查询成功:', result[0]);
    
    // 测试用户表查询
    const userCount = await prisma.user.count();
    console.log('✅ 用户表查询成功，用户数量:', userCount);
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'P1001') {
      console.error('网络连接问题: 无法访问数据库服务器');
    } else if (error.code === 'P1008') {
      console.error('连接超时: 数据库服务器响应超时');
    } else if (error.code === 'P1000') {
      console.error('认证失败: 用户名或密码错误');
    }
    
    console.error('完整错误信息:', error);
  } finally {
    await prisma.$disconnect();
    console.log('连接已关闭');
  }
}

testDatabaseConnection();