import fetch from 'node-fetch';

async function testAPI() {
  console.log('=== 测试创建测验 API ===');
  
  const examData = {
    title: "测试测验",
    questions: [
      {
        id: "q1",
        title: "第一题",
        options: [
          { id: "o1", content: "选项A", type: "text" },
          { id: "o2", content: "选项B", type: "text" }
        ],
        dropZones: [
          { id: "z1", label: "目标区1" },
          { id: "z2", label: "目标区2" }
        ],
        correctMapping: { o1: "z1", o2: "z2" }
      },
      {
        id: "q2",
        title: "第二题",
        options: [
          { id: "o3", content: "选项C", type: "text" },
          { id: "o4", content: "选项D", type: "text" }
        ],
        dropZones: [
          { id: "z3", label: "目标区3" },
          { id: "z4", label: "目标区4" }
        ],
        correctMapping: { o3: "z3", o4: "z4" }
      },
      {
        id: "q3",
        title: "第三题",
        options: [
          { id: "o5", content: "选项E", type: "text" },
          { id: "o6", content: "选项F", type: "text" }
        ],
        dropZones: [
          { id: "z5", label: "目标区5" },
          { id: "z6", label: "目标区6" }
        ],
        correctMapping: { o5: "z5", o6: "z6" }
      }
    ]
  };

  try {
    const createResponse = await fetch('http://localhost:3001/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData)
    });
    
    const createResult = await createResponse.json();
    console.log('创建测验结果:', createResult);
    
    if (createResult.id) {
      const examId = createResult.id;
      
      console.log('\n=== 测试获取测验 API ===');
      const getResponse = await fetch(`http://localhost:3001/exam/${examId}`);
      const getResult = await getResponse.json();
      console.log('获取测验结果:', JSON.stringify(getResult, null, 2));
      
      console.log('\n=== 测试提交答案 API ===');
      const submitData = {
        answers: [
          {
            questionId: "q1",
            placements: { o1: "z1", o2: "z2" }
          },
          {
            questionId: "q2",
            placements: { o3: "z4", o4: "z3" }
          },
          {
            questionId: "q3",
            placements: { o5: "z5", o6: "z6" }
          }
        ]
      };
      
      const startTime = Date.now();
      const submitResponse = await fetch(`http://localhost:3001/exam/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      const endTime = Date.now();
      
      const submitResult = await submitResponse.json();
      console.log('提交答案结果:', JSON.stringify(submitResult, null, 2));
      console.log(`评分耗时: ${endTime - startTime}ms`);
      
      console.log('\n=== 所有API测试通过 ===');
      console.log(`测验ID: ${examId}`);
      console.log(`访问链接: http://localhost:5176/#quiz/${examId}`);
    }
  } catch (error) {
    console.error('API测试失败:', error.message);
  }
}

testAPI();
