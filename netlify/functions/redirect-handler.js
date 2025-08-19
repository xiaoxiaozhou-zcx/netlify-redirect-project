const fetch = require('node-fetch');

// 自动生成1到100的域名映射（1 -> 1.484947.xyz, 2 -> 2.484947.xyz...）
const domainMap = {};
for (let i = 1; i <= 100; i++) {
  domainMap[i.toString()] = `${i}.484947.xyz`;
}

// 如需添加特殊映射，可以在这里补充（会覆盖自动生成的条目）
// 例如：domainMap['101'] = 'special.484947.xyz';

exports.handler = async (event, context) => {
  try {
    // 1. 获取用户访问的路径和参数
    const userPath = event.path || '';
    const queryString = event.queryStringParameters 
      ? new URLSearchParams(event.queryStringParameters).toString() 
      : '';
    const fullUserPath = userPath + (queryString ? `?${queryString}` : '');
    
    // 根路径返回提示
    if (fullUserPath === '/') {
      return {
        statusCode: 200,
        body: '请访问带路径的URL触发功能',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }

    // 2. 向目标IPv6地址发起请求（带用户路径）
    const targetIpv6 = `http://[2409:8087:1e01:20::3]${fullUserPath}`;
    
    // 设置请求超时（10秒）
    let timeoutId;
    const abortController = new AbortController();
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new Error('AbortError'));
      }, 10000);
    });
    
    // 3. 发送请求并处理超时
    let responseFromTarget;
    try {
      responseFromTarget = await Promise.race([
        fetch(targetIpv6, {
          method: 'GET',
          redirect: 'manual',
          signal: abortController.signal
        }),
        timeoutPromise
      ]);
    } finally {
      clearTimeout(timeoutId);
    }

    // 4. 检查目标是否返回302重定向
    if (responseFromTarget.status !== 302) {
      return {
        statusCode: 500,
        body: `目标未返回302，状态码：${responseFromTarget.status}`,
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }

    // 5. 提取Location头（重定向地址）
    const location = responseFromTarget.headers.get('location');
    if (!location) {
      return {
        statusCode: 500,
        body: '目标未返回Location头',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }

    // 6. 解析IPv6地址中的标识
    const ipv6Match = location.match(/\[?([0-9a-f:]+)\]?/i);
    if (!ipv6Match) {
      return {
        statusCode: 500,
        body: `无法解析IPv6地址，Location: ${location}`,
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }
    const ipv6Address = ipv6Match[1];
    
    const identifierMatch = ipv6Address.match(/::(\d+)$/);
    if (!identifierMatch) {
      return {
        statusCode: 500,
        body: `无法提取标识，IPv6: ${ipv6Address}`,
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }
    const identifier = identifierMatch[1];

    // 7. 提取目标重定向中的路径部分
    const pathMatch = location.match(/(?:\]|:\d+|::)(\/.*)/);
    if (!pathMatch || !pathMatch[1]) {
      return {
        statusCode: 500,
        body: `无法解析路径，Location: ${location}`,
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }
    const pathFromTarget = pathMatch[1];

    // 8. 构建最终重定向地址（使用自动生成的映射表）
    const targetDomain = domainMap[identifier] || `${identifier}.484947.xyz`;
    const finalUrl = `https://${targetDomain}${pathFromTarget}`;

    // 9. 返回302重定向
    return {
      statusCode: 302,
      headers: {
        'Location': finalUrl,
        'Content-Type': 'text/plain'
      },
      body: `Redirecting to ${finalUrl}`
    };

  } catch (error) {
    // 错误处理
    if (error.message === 'AbortError') {
      return {
        statusCode: 504,
        body: '请求目标超时',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    } else if (error.message.includes('net::') || error.message.includes('fetch failed')) {
      return {
        statusCode: 503,
        body: '无法连接目标地址',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    } else {
      return {
        statusCode: 500,
        body: `处理错误: ${error.message}`,
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    }
  }
};
