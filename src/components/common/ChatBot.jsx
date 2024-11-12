import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css'; // CSS 스타일 import

// OpenAI API 키
const OPENAI_API_KEY = 'your-openai-api-key';

function ChatBot() {
    const [messages, setMessages] = useState([]);  // 채팅 메시지 저장
    const [userInput, setUserInput] = useState('');  // 사용자 입력 상태 관리
    const [isTyping, setIsTyping] = useState(false); // 타이핑 여부 상태 관리
    const chatBoxRef = useRef(null); // 채팅 박스를 참조하여 스크롤 관리

    // 메시지 불러오기
    useEffect(() => {
        const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        setMessages(storedMessages); // 로컬 저장소에서 메시지 불러오기
    }, []);

    // 메시지 저장하기
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages)); // 메시지 로컬 저장소에 저장
    }, [messages]);

    // 타이핑 효과 구현
    const simulateTypingEffect = (messageText, callback) => {
        let index = 0;
        setIsTyping(true);
        let currentMessage = ''; // 타이핑 중인 메시지를 보관할 변수

        // 타이핑 효과
        const typingInterval = setInterval(() => {
            if (index < messageText.length) {
                // 한 글자씩 추가하여 메시지를 갱신
                currentMessage += messageText[index];
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    return [...prevMessages.slice(0, -1), { ...lastMessage, text: currentMessage }];
                });
                index++;
            } else {
                clearInterval(typingInterval);
                setIsTyping(false);
                callback(); // 타이핑 종료 후 호출
            }
        }, 100); // 100ms 간격으로 타이핑 효과 구현
    };

    // 메시지에 자동으로 <br /> 추가
    const formatMessageText = (text) => {
        return text.split('\n').map((str, index) => (
            <React.Fragment key={index}>
                {str}
                {index < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // 메시지 보내기
    const sendMessage = async () => {
        if (userInput.trim() === '' || isTyping) return; // 타이핑 중일 때는 메시지 전송을 막음

        const userMessage = {
            sender: 'user',
            text: userInput,
            timestamp: new Date().toLocaleTimeString(),
        };

        // 1. 사용자 메시지 추가
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        // 2. OpenAI ChatGPT API로 메시지 보내기
        try {
            const gptMessage = await getChatGPTResponse(userInput);
            setIsTyping(true); // 타이핑 시작
            simulateTypingEffect(gptMessage, () => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: gptMessage, timestamp: new Date().toLocaleTimeString() },
                ]);
            }); // 타이핑 효과 후 메시지 추가
        } catch (error) {
            console.error('Error fetching ChatGPT response:', error);
        }

        // 3. 입력 필드 비우기
        setUserInput('');
        scrollToBottom();
    };

    // OpenAI API에서 응답 받기
    const getChatGPTResponse = async (message) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }],
            }),
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    };

    // 스크롤을 항상 최신 메시지로 내리기
    const scrollToBottom = () => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    };

    // 컴포넌트가 처음 마운트될 때 초기 메시지를 타이핑 효과로 처리
    useEffect(() => {
        const fetchMessages = async () => {
            const initialMessages = [
                { sender: 'bot', text: '안녕하세요! 저는 프롬버스 AI "프롬이"에요 :D \n 무엇을 도와드릴까요?', timestamp: new Date().toLocaleTimeString() },
            ];
            setMessages(initialMessages); // 처음 메시지 표시
            const initialMessage = initialMessages[0];
            simulateTypingEffect(initialMessage.text, () => {}); // 첫 번째 메시지 타이핑 효과
        };

        fetchMessages();
    }, []);

    useEffect(() => {
        // 채팅박스를 항상 최신 상태로 스크롤
        scrollToBottom();
    }, [messages]); // messages가 바뀔 때마다 호출

    return (
        <div className="chat-container">
            <div className="user-info">
                <a href="masterView.member?meNo=1" className="info" target="_blank">
                    <div className="name">
                        프롬이 AI
                        <div className="address">
                            <i className="bi bi-geo-alt"></i>
                            <span>프롬버스(FromBirth)</span>
                        </div>
                    </div>
                </a>
            </div>

            <div className="chat-inner">
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.sender}`}>
                            <div className={message.sender === 'bot' ? 'left' : 'right'}>
                                {message.sender === 'bot' && (
                                    <div className="profile-img">
                                        <img src="/src/assets/img/baby2.png" alt="Bot" />
                                    </div>
                                )}
                                <div className="message-text">
                                    {formatMessageText(message.text)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="input-group">
                    <input
                        type="text"
                        id="chat-input"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="메시지를 입력하세요"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={isTyping}  // 타이핑 중이면 비활성화
                    />
                    <button
                        type="button"
                        onClick={sendMessage}
                        disabled={isTyping}  // 타이핑 중이면 비활성화
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatBot;