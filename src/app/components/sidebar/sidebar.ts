// 3. src/app/components/sidebar/sidebar.component.ts
// ============================================
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ChatSession } from '../../models/chat.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  imports: [CommonModule],
  standalone: true
})
export class SidebarComponent implements OnInit {
  chatSessions$: Observable<ChatSession[]>;
  currentSession$: Observable<ChatSession | null>;

  constructor(private chatService: ChatService) {
    this.chatSessions$ = this.chatService.chatSessions$;
    this.currentSession$ = this.chatService.currentSession$;
  }

  ngOnInit(): void {}

  createNewChat(): void {
    this.chatService.createNewSession();
  }

  selectChat(sessionId: string): void {
    this.chatService.selectSession(sessionId);
  }

  deleteChat(event: Event, sessionId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      this.chatService.deleteSession(sessionId);
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
