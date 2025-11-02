// 2. src/app/services/chat.service.ts
// ============================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatSession, Message, ApiResponse } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
  private apiKey = 'sk-default-jJ12tyVdLauJ9zH1DQMg4VBcP3DEQshZ';
  private userId = 'xibix75909@hh7f.com';
  private agentId = '69074e6d40006cfb21b17d98';

  private chatSessionsSubject = new BehaviorSubject<ChatSession[]>([]);
  public chatSessions$ = this.chatSessionsSubject.asObservable();

  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessions();
  }

  public hasActiveSession(): boolean {
    return this.currentSessionSubject.value !== null;
  }

  private loadSessions(): void {
    const stored = localStorage.getItem('chatSessions');
    if (stored) {
      const sessions = JSON.parse(stored);
      sessions.forEach((s: any) => {
        s.createdAt = new Date(s.createdAt);
        s.updatedAt = new Date(s.updatedAt);
        s.messages.forEach((m: any) => m.timestamp = new Date(m.timestamp));
      });
      this.chatSessionsSubject.next(sessions);
    }
  }

  private saveSessions(): void {
    localStorage.setItem('chatSessions', JSON.stringify(this.chatSessionsSubject.value));
  }

  createNewSession(): ChatSession {
    const newSession: ChatSession = {
      id: this.generateSessionId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sessions = [...this.chatSessionsSubject.value, newSession];
    this.chatSessionsSubject.next(sessions);
    this.currentSessionSubject.next(newSession);
    this.saveSessions();

    return newSession;
  }

  selectSession(sessionId: string): void {
    const session = this.chatSessionsSubject.value.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionSubject.next(session);
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.chatSessionsSubject.value.filter(s => s.id !== sessionId);
    this.chatSessionsSubject.next(sessions);

    if (this.currentSessionSubject.value?.id === sessionId) {
      this.currentSessionSubject.next(sessions.length > 0 ? sessions[0] : null);
    }

    this.saveSessions();
  }

  sendMessage(message: string): Observable<Message> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) {
      throw new Error('No active session');
    }

    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    currentSession.messages.push(userMessage);

    if (currentSession.messages.length === 1) {
      currentSession.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    }

    currentSession.updatedAt = new Date();
    this.updateSession(currentSession);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    });

    const body = {
      user_id: this.userId,
      agent_id: this.agentId,
      session_id: currentSession.id,
      message: message
    };

    return this.http.post<ApiResponse>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const assistantMessage: Message = {
          id: this.generateMessageId(),
          role: 'assistant',
          content: response.response || 'No response received',
          timestamp: new Date()
        };

        currentSession.messages.push(assistantMessage);
        currentSession.updatedAt = new Date();
        this.updateSession(currentSession);

        return assistantMessage;
      })
    );
  }

  private updateSession(session: ChatSession): void {
    const sessions = this.chatSessionsSubject.value.map(s =>
      s.id === session.id ? session : s
    );
    this.chatSessionsSubject.next(sessions);
    this.currentSessionSubject.next(session);
    this.saveSessions();
  }

  private generateSessionId(): string {
    return `${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
