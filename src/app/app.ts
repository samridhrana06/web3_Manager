// 9. src/app/app.component.ts
// ============================================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';
import { ChatComponent } from './components/chat/chat';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [CommonModule, FormsModule, ChatComponent, SidebarComponent],
  standalone: true
})
export class AppComponent implements OnInit {
  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Create initial session if no sessions exist and select it
    this.chatService.chatSessions$.subscribe(sessions => {
      if (sessions.length === 0) {
        // Create new session
        const newSession = this.chatService.createNewSession();
      } else if (!this.chatService.hasActiveSession()) {
        // If there are sessions but none is selected, select the first one
        this.chatService.selectSession(sessions[0].id);
      }
    });
  }
}
