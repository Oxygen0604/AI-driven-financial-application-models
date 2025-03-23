import React from 'react';
import Shell from '../../component/shell/shell';
import { Col, Row, Typography, Card, Tag } from 'antd';
const { Title, Paragraph } = Typography;

const Analyse: React.FC = () => {
  return (
    <div  className="analyse" >

        <div className='shell'>
            <Shell />
        </div>

        <div className='content' style={{ marginLeft: 94,marginRight: 94 }}>
            <Title level={2}>分析结果</Title>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                <Card title="基本信息" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                    姓名: 张三  
                    <br />
                    邮箱: zhangsan@example.com  
                    <br />
                    电话: 123-456-7890  
                    <br />
                    LinkedIn: <a href="#">https://linkedin.com/in/zhangsan</a>
                    </Paragraph>
                </Card>
                </Col>

                <Col span={12}>
                <Card title="教育经历" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                    清华大学 - 本科 (计算机科学)  
                    <br />
                    时间: 2015 - 2019  
                    </Paragraph>
                </Card>
                </Col>

                <Col span={24}>
                <Card title="工作经历" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                    <strong>腾讯</strong> (2019 - 2022)  
                    <br />
                    职位: 前端工程师  
                    <br />
                    描述: 负责开发和维护公司前端框架。  
                    </Paragraph>
                    <Paragraph>
                    <strong>阿里巴巴</strong> (2022 - 至今)  
                    <br />
                    职位: 高级前端工程师  
                    <br />
                    描述: 负责公司前端架构的优化和性能提升。  
                    </Paragraph>
                </Card>
                </Col>

                <Col span={24}>
                <Card title="技能" bordered={false} style={{ marginBottom: 16 }}>
                    <Tag color="blue">React</Tag>
                    <Tag color="blue">TypeScript</Tag>
                    <Tag color="blue">Ant Design</Tag>
                    <Tag color="blue">Webpack</Tag>
                </Card>
                </Col>

                <Col span={24}>
                <Card title="个人总结" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                    熟悉前端开发，掌握 React 和 TypeScript，具备丰富的前端项目开发经验。  
                    </Paragraph>
                </Card>
                </Col>
            </Row>
        </div>
      
    </div>
  );
};

export default Analyse;
