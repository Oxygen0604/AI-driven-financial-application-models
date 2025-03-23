import React from 'react';
import { useState, useEffect } from 'react';
import Shell from '../../component/shell/shell';
import { Col, Row, Typography, Card, Tag } from 'antd';
import { useFileStore } from '../../store';
const { Title, Paragraph } = Typography;

const Analyse: React.FC =() => {
    const [Keywords, setKeywords] = useState<string[]>([]);
    const [Summary, setSummary] = useState<string>('');
    const [Outline, setOutline] = useState<string[]>([]);
    const getResponse = useFileStore(state => state.getResponse);
    const id = useFileStore(state => state.id);
    getResponse(id).then(response => {
        setKeywords((response.data.keywords).split(','));
        setSummary(response.data.summary);
        setOutline((response.data.outline).split('-'));
    });

  return (
    <div  className="analyse" >

        <div className='shell'>
            <Shell />
        </div>

        <div className='content' style={{ marginLeft: 94,marginRight: 94 }}>
            <Title level={2}>分析结果</Title>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                <Card title="架构简述" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                        {
                            Outline.map((item:string, index:number) => (
                                <p key={index}>{item}</p>
                            ))
                        }
                    </Paragraph>
                </Card>
                </Col>

                <Col span={24}>
                <Card title="关键词" bordered={false} style={{ marginBottom: 16 }}>
                    {
                        Keywords.map((keyword:string, index:number) => (
                            <Tag key={index}>{keyword}</Tag>
                        ))
                    }
                </Card>
                </Col>

                <Col span={24}>
                <Card title="总结" bordered={false} style={{ marginBottom: 16 }}>
                    <Paragraph>
                    `{Summary}`  
                    </Paragraph>
                </Card>
                </Col>
            </Row>
        </div>
      
    </div>
  );
};

export default Analyse;
