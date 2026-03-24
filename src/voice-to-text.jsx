import { useState, useRef, useEffect } from "react";

export default function useSpeechToText() {
    const [text, setText] = useState("");
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window)) return;

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setText(transcript);
        };

        recognitionRef.current = recognition;
    }, []);

    const startListening = () => {
        if (!recognitionRef.current) return;
        setListening(true);
        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (!recognitionRef.current) return;
        setListening(false);
        recognitionRef.current.stop();
    };

    return { text, listening, startListening, stopListening };
}