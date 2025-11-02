import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../../services/chat.service';
import { ChatSession, Message } from '../../models/chat.model';
import { Observable } from 'rxjs';
import { marked } from 'marked';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  currentSession$: Observable<ChatSession | null>;
  messageText = '';
  isLoading = false;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer
  ) {
    this.currentSession$ = this.chatService.currentSession$;
    // Configure marked options
    marked.setOptions({
      breaks: true, // Enable line breaks
      gfm: true // Enable GitHub Flavored Markdown
    });
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim() || this.isLoading) return;

    // Check if we have an active session
    if (!this.chatService.hasActiveSession()) {
      // Create a new session if none exists
      this.chatService.createNewSession();
    }

    const message = this.messageText.trim();
    this.messageText = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.chatService.sendMessage(message).subscribe({
      next: () => {
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
        if (error.message === 'No active session') {
          // Try to create a new session and send the message again
          this.chatService.createNewSession();
          this.messageText = message; // Restore the message
          this.sendMessage(); // Try sending again
        } else {
          alert('Failed to send message. Please try again.');
        }
      }
    });
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessageContent(content: string): SafeHtml {
    try {
      // Convert markdown to HTML
      const html = marked(content);
      // Sanitize the HTML to prevent XSS attacks
      return this.sanitizer.sanitize(SecurityContext.HTML, html) || '';
    } catch (error) {
      console.error('Error formatting message:', error);
      return content;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}
