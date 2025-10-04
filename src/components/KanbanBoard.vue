<template>
  <div class="app-container">
    <!-- Сайдбар -->
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-if="!isSidebarCollapsed">
          <span>🚀 Kanban</span>
        </div>
        <el-button 
          :icon="isSidebarCollapsed ? Expand : Fold" 
          @click="toggleSidebar"
          class="collapse-btn"
          text
          circle
        />
      </div>

      <!-- Меню пользователя в сайдбаре -->
      <div class="user-section">
        <div class="user-info">
          <el-avatar :size="32" :src="currentUser.avatar" />
          <div class="user-details" v-if="!isSidebarCollapsed">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
        </div>
      </div>

      <div class="sidebar-content">
        <!-- Навигация -->
        <div class="sidebar-nav">
          <div 
            class="nav-item" 
            :class="{ active: activeNav === 'projects' }"
            @click="activeNav = 'projects'"
          >
            <el-icon><Folder /></el-icon>
            <span v-if="!isSidebarCollapsed">Проекты</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeNav === 'team' }"
            @click="activeNav = 'team'"
          >
            <el-icon><User /></el-icon>
            <span v-if="!isSidebarCollapsed">Команда</span>
          </div>
        </div>

        <!-- Контент в зависимости от выбранной навигации -->
        <div class="sidebar-panel">
          <!-- Панель проектов -->
          <div v-if="activeNav === 'projects'" class="projects-section">
            <div class="section-header" v-if="!isSidebarCollapsed">
              <span>Проекты</span>
              <el-button 
                type="primary" 
                :icon="Plus" 
                size="small" 
                circle 
                @click="openAddProjectDialog"
              />
            </div>
            <el-tooltip 
              v-else
              content="Добавить проект" 
              placement="right"
            >
              <el-button 
                type="primary" 
                :icon="Plus" 
                size="small" 
                circle 
                @click="openAddProjectDialog"
                class="icon-btn"
              />
            </el-tooltip>

            <div class="projects-list">
              <div
                v-for="project in projects"
                :key="project.id"
                class="project-item"
                :class="{ active: currentProject?.id === project.id }"
                @click="selectProject(project)"
              >
                <div class="project-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="project-info" v-if="!isSidebarCollapsed">
                  <span class="project-name">{{ project.name }}</span>
                  <span class="project-stats">
                    {{ getProjectStats(project) }}
                  </span>
                </div>
                <el-tooltip 
                  v-else
                  :content="project.name" 
                  placement="right"
                >
                  <div class="project-icon">
                    <el-icon><Folder /></el-icon>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- Панель команды -->
          <div v-if="activeNav === 'team'" class="team-section">
            <div class="section-header" v-if="!isSidebarCollapsed">
              <span>Команда</span>
              <el-button 
                type="primary" 
                :icon="Plus" 
                size="small" 
                circle 
                @click="openAddTeamMemberDialog"
              />
            </div>

            <div class="team-list">
              <div
                v-for="member in teamMembers"
                :key="member.id"
                class="team-member"
              >
                <div class="member-avatar">
                  <el-avatar :size="32" :src="member.avatar" />
                </div>
                <div class="member-info" v-if="!isSidebarCollapsed">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-role">{{ member.role }}</span>
                  <div class="member-projects">
                    <span v-for="projectId in member.projects" :key="projectId" class="project-tag">
                      {{ getProjectName(projectId) }}
                    </span>
                  </div>
                </div>
                <div class="member-actions" v-if="!isSidebarCollapsed">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    size="small"
                    text
                    circle
                    @click.stop="openEditTeamMemberDialog(member)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Хедер проекта -->
      <div class="project-header">
        <div class="project-title-section">
          <!-- Название проекта - редактируемое по клику -->
          <div 
            v-if="currentProject && !projectTitleEditing"
            class="project-title-display"
            @click="startEditingProjectTitle"
          >
            <h1 class="project-title">{{ currentProject.name }}</h1>
            <el-icon><Edit /></el-icon>
          </div>
          <el-input
            v-else-if="currentProject"
            v-model="currentProject.name"
            class="project-title-input"
            placeholder="Название проекта"
            @blur="finishEditingProjectTitle"
            @keyup.enter="finishEditingProjectTitle"
            ref="projectTitleInput"
            autofocus
          />
          
          <!-- Описание проекта - редактируемое по клику -->
          <div 
            v-if="currentProject && !projectDescriptionEditing"
            class="project-description-display"
            @click="startEditingProjectDescription"
          >
            <p class="project-description">{{ currentProject.description || 'Добавить описание проекта...' }}</p>
            <el-icon><Edit /></el-icon>
          </div>
          <el-input
            v-else-if="currentProject"
            v-model="currentProject.description"
            class="project-description-input"
            placeholder="Добавить описание проекта..."
            type="textarea"
            :rows="2"
            @blur="finishEditingProjectDescription"
            @keyup.enter="finishEditingProjectDescription"
            ref="projectDescriptionInput"
            autofocus
          />
          
          <div v-else class="project-placeholder">
            <h1>Выберите проект</h1>
          </div>
        </div>
      </div>

      <!-- Вкладки представлений -->
      <div class="view-tabs">
        <el-tabs v-model="activeView" type="card" @tab-click="handleTabClick">
          <el-tab-pane label="Таблица" name="table">
            <TableView 
              :projects="projects"
              :current-project="currentProject"
              @update-task="updateTask"
              @delete-task="deleteTaskFromTable"
              @open-task="openTaskDetails"
            />
          </el-tab-pane>
          <el-tab-pane label="Доска" name="board">
            <div class="kanban-view">
              <div class="board" v-if="currentProject">
                <draggable 
                  v-model="currentProject.columns" 
                  group="columns"
                  item-key="id"
                  class="columns-container"
                  @end="onColumnDragEnd"
                >
                  <template #item="{ element: column }">
                    <div 
                      class="column-wrapper"
                      @mouseenter="hoveredColumn = column.id"
                      @mouseleave="hoveredColumn = null"
                    >
                      <div class="column" :style="{ '--column-color': column.color || '#409EFF' }">
                        <div class="column-header">
                          <div class="column-title-section">
                            <!-- Цвет колонки -->
                            <div 
                              class="column-color-indicator"
                              :style="{ backgroundColor: column.color || '#409EFF' }"
                              @click="openColorPicker(column)"
                            ></div>
                            
                            <!-- Название колонки - редактируемое по клику -->
                            <div 
                              v-if="!column.editing"
                              class="column-title-display"
                              @click="startEditingColumn(column)"
                            >
                              <span class="column-title">{{ column.title }}</span>
                              <span class="task-count">{{ column.tasks.length }}</span>
                            </div>
                            
                            <!-- Поле редактирования -->
                            <el-input
                              v-else
                              v-model="column.title"
                              @blur="finishEditingColumn(column)"
                              @keyup.enter="finishEditingColumn(column)"
                              class="column-title-input"
                              size="small"
                              ref="columnInput"
                              autofocus
                            />
                          </div>
                          
                          <!-- Меню колонки (показывается только при наведении) -->
                          <div class="column-menu" v-show="hoveredColumn === column.id">
                            <el-dropdown trigger="click" @command="(command) => handleColumnCommand(command, column)">
                              <el-button
                                :icon="More"
                                size="small"
                                text
                                circle
                              />
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="changeColor">
                                    <el-icon><Brush /></el-icon>
                                    Изменить цвет
                                  </el-dropdown-item>
                                  <el-dropdown-item command="addTask">
                                    <el-icon><Plus /></el-icon>
                                    Добавить задачу
                                  </el-dropdown-item>
                                  <el-dropdown-item divided command="deleteColumn" :disabled="currentProject.columns.length <= 1">
                                    <el-icon><Delete /></el-icon>
                                    Удалить колонку
                                  </el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
                          </div>
                        </div>

                        <draggable
                          v-model="column.tasks"
                          group="tasks"
                          item-key="id"
                          class="tasks"
                          @end="onTaskDragEnd"
                        >
                          <template #item="{ element: task }">
                            <div
                              class="task-card"
                              @click="openTaskDetails(task)"
                            >
                              <div class="task-content">
                                <div class="task-header">
                                  <p class="task-title">{{ task.title }}</p>
                                </div>
                                
                                <div class="task-meta">
                                  <div class="assignee-info" v-if="task.assignee">
                                    <el-avatar :size="20" :src="task.assignee.avatar" />
                                  </div>
                                  
                                  <div class="task-tags">
                                    <el-tag 
                                      size="small" 
                                      :type="getPriorityType(task.priority)"
                                      :effect="isOverdue(task.deadline) ? 'dark' : 'light'"
                                    >
                                      {{ task.priority }}
                                    </el-tag>
                                    
                                    <div v-if="task.deadline" class="deadline-info">
                                      <el-icon><Clock /></el-icon>
                                      <span :class="{ 'overdue': isOverdue(task.deadline) }">
                                        {{ formatDate(task.deadline) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </template>
                        </draggable>

                        <!-- Кнопка добавления задачи -->
                        <div class="column-footer" v-show="hoveredColumn === column.id">
                          <el-button 
                            type="primary" 
                            text 
                            :icon="Plus"
                            @click="openAddTaskDialog(column.id)"
                          >
                            Добавить задачу
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </template>
                </draggable>

                <!-- Кнопка добавления колонки -->
                <div class="add-column-section">
                  <el-button 
                    type="primary" 
                    :icon="Plus" 
                    @click="openAddColumnDialog"
                    class="add-column-btn"
                  >
                    Добавить колонку
                  </el-button>
                </div>
              </div>

              <!-- Пустое состояние -->
              <div v-else class="empty-state">
                <el-empty description="Выберите или создайте проект">
                  <el-button type="primary" @click="openAddProjectDialog">
                    Создать проект
                  </el-button>
                </el-empty>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Мои задачи" name="myTasks">
            <MyTasksView 
              :projects="projects"
              :current-user="currentUser"
              @update-task="updateTask"
              @open-task="openTaskDetails"
            />
          </el-tab-pane>
          <el-tab-pane label="График" name="gantt">
            <GanttView 
              :projects="projects"
              :current-project="currentProject"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- Боковая панель деталей задачи -->
    <el-drawer
      v-model="detailDrawerVisible"
      direction="rtl"
      size="40%"
      class="task-detail-drawer"
      :with-header="false"
    >
      <div class="task-detail-content" v-if="currentTask">
        <!-- Заголовок -->
        <div class="task-detail-header">
          <el-button 
            :icon="Close" 
            text 
            circle 
            @click="closeTaskDetails"
            class="close-btn"
          />
        </div>

        <div class="task-detail-body">
          <!-- Название задачи -->
          <div class="task-title-section">
            <h1 class="task-main-title">{{ currentTask.title }}</h1>
          </div>

          <!-- Трекинг времени -->
          <div class="time-tracking-section">
            <div class="time-tracking-card">
              <div class="time-display">
                <div class="time-estimate">
                  <label>Оценка времени:</label>
                  <div class="time-input-group">
                    <el-input-number 
                      v-model="currentTask.timeEstimate.hours" 
                      :min="0" 
                      :max="999" 
                      size="small"
                      placeholder="Час"
                    />
                    <span>ч</span>
                    <el-input-number 
                      v-model="currentTask.timeEstimate.minutes" 
                      :min="0" 
                      :max="59" 
                      size="small"
                      placeholder="Мин"
                    />
                    <span>м</span>
                  </div>
                </div>
                
                <div class="time-tracked">
                  <label>Затрачено времени:</label>
                  <div class="tracked-time">
                    <span class="time-value">{{ formatTrackedTime(currentTask.timeTracked) }}</span>
                    <div class="timer-controls">
                      <el-button 
                        type="primary" 
                        :icon="currentTask.timerRunning ? VideoPause : VideoPlay" 
                        circle 
                        size="small"
                        @click="toggleTimer"
                        :class="{ active: currentTask.timerRunning }"
                      />
                      <el-button 
                        type="danger" 
                        :icon="RefreshRight" 
                        circle 
                        size="small"
                        @click="resetTimer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Основные свойства -->
          <div class="task-properties">
            <!-- Первая строка: статус и приоритет -->
            <div class="property-row">
              <div class="property-item">
                <label class="property-label">Статус</label>
                <div class="property-value">
                  <el-tag :type="getStatusType(currentTask.columnId)" size="large">
                    {{ getColumnTitleById(currentTask.columnId) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="property-item">
                <label class="property-label">Приоритет</label>
                <div class="property-value">
                  <el-tag 
                    :type="getPriorityType(currentTask.priority)" 
                    size="large"
                    :effect="isOverdue(currentTask.deadline) ? 'dark' : 'light'"
                  >
                    {{ currentTask.priority }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- Вторая строка: исполнитель и постановщик -->
            <div class="property-row">
              <div class="property-item">
                <label class="property-label">Исполнитель</label>
                <div class="property-value">
                  <div v-if="currentTask.assignee" class="user-display">
                    <el-avatar :size="32" :src="currentTask.assignee.avatar" />
                    <div class="user-info">
                      <span class="user-name">{{ currentTask.assignee.name }}</span>
                    </div>
                  </div>
                  <span v-else class="empty-value">Не назначен</span>
                </div>
              </div>

              <div class="property-item">
                <label class="property-label">Постановщик</label>
                <div class="property-value">
                  <div class="user-display">
                    <el-avatar :size="32" :src="currentTask.creator?.avatar || currentUser.avatar" />
                    <div class="user-info">
                      <span class="user-name">{{ currentTask.creator?.name || currentUser.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Третья строка: даты -->
            <div class="property-row">
              <div class="property-item">
                <label class="property-label">Создана</label>
                <div class="property-value date-value">
                  {{ formatDate(currentTask.createdAt) }}
                </div>
              </div>

              <div class="property-item">
                <label class="property-label">Обновлена</label>
                <div class="property-value date-value">
                  {{ formatDate(currentTask.updatedAt) }}
                </div>
              </div>
            </div>

            <!-- Дедлайн -->
            <div class="property-item full-width">
              <label class="property-label">Дедлайн</label>
              <div class="property-value">
                <div class="deadline-display" :class="{ 'overdue': isOverdue(currentTask.deadline) }">
                  <el-icon><Calendar /></el-icon>
                  <span class="deadline-text">
                    {{ currentTask.deadline ? formatDate(currentTask.deadline) : 'Не установлен' }}
                  </span>
                  <el-tag 
                    v-if="currentTask.deadline" 
                    :type="getTimeRemainingType(currentTask.deadline)" 
                    size="small"
                    class="time-remaining-tag"
                  >
                    {{ getTimeRemainingText(currentTask.deadline) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Подзадачи -->
          <div class="subtasks-section">
            <div class="section-header">
              <h3>Подзадачи</h3>
              <el-button type="primary" :icon="Plus" size="small" @click="addSubtask">
                Добавить
              </el-button>
            </div>
            
            <div class="subtasks-list">
              <div 
                v-for="(subtask, index) in currentTask.subtasks" 
                :key="subtask.id"
                class="subtask-item"
              >
                <el-checkbox v-model="subtask.completed" @change="updateSubtask(subtask)">
                  <span :class="{ completed: subtask.completed }">{{ subtask.title }}</span>
                </el-checkbox>
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  text
                  circle
                  @click="removeSubtask(index)"
                />
              </div>
              
              <div v-if="!currentTask.subtasks || currentTask.subtasks.length === 0" class="empty-subtasks">
                <p>Нет подзадач</p>
              </div>
            </div>
          </div>

          <!-- Чек-лист -->
          <div class="checklist-section">
            <div class="section-header">
              <h3>Чек-лист</h3>
              <el-button type="primary" :icon="Plus" size="small" @click="addChecklistItem">
                Добавить
              </el-button>
            </div>
            
            <div class="checklist-items">
              <div 
                v-for="(item, index) in currentTask.checklist" 
                :key="item.id"
                class="checklist-item"
              >
                <el-checkbox v-model="item.completed" @change="updateChecklistItem(item)">
                  <span :class="{ completed: item.completed }">{{ item.text }}</span>
                </el-checkbox>
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  text
                  circle
                  @click="removeChecklistItem(index)"
                />
              </div>
              
              <div v-if="!currentTask.checklist || currentTask.checklist.length === 0" class="empty-checklist">
                <p>Нет пунктов в чек-листе</p>
              </div>
            </div>
          </div>

          <!-- Описание задачи -->
          <div class="description-section">
            <h3>Описание</h3>
            <div class="task-description-content">
              <p v-if="currentTask.description" class="description-text">
                {{ currentTask.description }}
              </p>
              <p v-else class="empty-description">
                Нет описания
              </p>
            </div>
          </div>

          <!-- Комментарии -->
          <div class="comments-section">
            <div class="comments-header">
              <h3>Комментарии</h3>
              <span class="comments-count">{{ currentTask.comments?.length || 0 }}</span>
            </div>
            
            <!-- Список комментариев -->
            <div class="comments-list" v-if="currentTask.comments && currentTask.comments.length > 0">
              <div 
                v-for="comment in currentTask.comments" 
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-header">
                  <el-avatar :size="28" :src="comment.author.avatar" />
                  <div class="comment-author">
                    <span class="author-name">{{ comment.author.name }}</span>
                    <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                  </div>
                </div>
                <div class="comment-content">
                  {{ comment.content }}
                </div>
              </div>
            </div>
            
            <!-- Пустые комментарии -->
            <div v-else class="empty-comments">
              <p>Пока нет комментариев</p>
            </div>

            <!-- Форма добавления комментария -->
            <div class="add-comment-section">
              <div class="comment-input-wrapper">
                <el-avatar :size="32" :src="currentUser.avatar" class="current-user-avatar" />
                <div class="comment-input-container">
                  <el-input
                    v-model="newComment"
                    type="textarea"
                    :rows="3"
                    placeholder="Напишите комментарий..."
                    class="comment-input"
                  />
                  <div class="comment-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="addComment"
                      :disabled="!newComment.trim()"
                    >
                      Отправить
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Футер с действиями -->
        <div class="task-detail-footer">
          <el-button @click="closeTaskDetails">Закрыть</el-button>
          <el-button type="primary" @click="editTask(currentTask)">
            Редактировать задачу
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Диалоги (проекты, задачи, команда) -->
    <el-dialog 
      v-model="projectDialogVisible" 
      :title="editingProject ? 'Редактирование проекта' : 'Новый проект'" 
      width="400"
    >
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="Название" required>
          <el-input 
            v-model="projectForm.name" 
            placeholder="Введите название проекта"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input 
            v-model="projectForm.description" 
            type="textarea"
            placeholder="Описание проекта"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="projectDialogVisible = false">Отмена</el-button>
        <el-button 
          type="primary" 
          @click="saveProject"
          :disabled="!projectForm.name.trim()"
        >
          {{ editingProject ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог добавления/редактирования участника команды -->
    <el-dialog 
      v-model="teamMemberDialogVisible" 
      :title="editingTeamMember ? 'Редактирование участника' : 'Новый участник'" 
      width="500"
    >
      <el-form :model="teamMemberForm" label-width="120px">
        <el-form-item label="Имя" required>
          <el-input v-model="teamMemberForm.name" placeholder="Введите имя" />
        </el-form-item>
        <el-form-item label="Должность" required>
          <el-input v-model="teamMemberForm.role" placeholder="Введите должность" />
        </el-form-item>
        <el-form-item label="Фото">
          <el-input v-model="teamMemberForm.avatar" placeholder="URL фото" />
        </el-form-item>
        <el-form-item label="Проекты">
          <el-select v-model="teamMemberForm.projects" multiple placeholder="Выберите проекты">
            <el-option 
              v-for="project in projects" 
              :key="project.id"
              :label="project.name" 
              :value="project.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="teamMemberDialogVisible = false">Отмена</el-button>
        <el-button 
          type="primary" 
          @click="saveTeamMember"
          :disabled="!teamMemberForm.name.trim() || !teamMemberForm.role.trim()"
        >
          {{ editingTeamMember ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Остальные диалоги... -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  Plus, Delete, Clock, Edit, Fold, Expand, Folder, Menu, ArrowDown, 
  More, Brush, Close, Calendar, User, VideoPlay, VideoPause, RefreshRight
} from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'
import TableView from './TableView.vue'
import MyTasksView from './MyTasksView.vue'
import GanttView from './GanttView.vue'

// Текущий пользователь
const currentUser = ref({
  id: 1,
  name: 'Алексей Иванов',
  avatar: '',
  email: 'alexey@company.com',
  role: 'Frontend Developer'
})

// Состояние интерфейса
const isSidebarCollapsed = ref(false)
const activeView = ref('board')
const activeNav = ref('projects')
const hoveredColumn = ref(null)
const detailDrawerVisible = ref(false)
const projectTitleEditing = ref(false)
const projectDescriptionEditing = ref(false)

// Таймер для трекинга времени
let timerInterval = null

// Команда проекта
const teamMembers = ref([
  { 
    id: 1, 
    name: 'Алексей Иванов', 
    avatar: '', 
    role: 'Frontend Developer',
    projects: [1]
  },
  { 
    id: 2, 
    name: 'Мария Петрова', 
    avatar: '', 
    role: 'UI/UX Designer',
    projects: [1]
  },
  { 
    id: 3, 
    name: 'Дмитрий Сидоров', 
    avatar: '', 
    role: 'Backend Developer',
    projects: [1]
  },
  { 
    id: 4, 
    name: 'Елена Козлова', 
    avatar: '', 
    role: 'Project Manager',
    projects: [1]
  }
])

// Состояние проектов
const projects = ref([
  {
    id: 1,
    name: 'Разработка продукта',
    description: 'Основной проект по разработке нового продукта',
    columns: [
      {
        id: 'todo',
        title: 'Бэклог',
        color: '#4F46E5',
        editing: false,
        tasks: [
          { 
            id: 1, 
            title: 'Прототип интерфейса', 
            description: 'Создать прототип основного интерфейса в Figma с учетом пользовательского опыта и современных тенденций дизайна.', 
            priority: 'Высокий',
            deadline: '2024-12-31 18:00:00',
            createdAt: '2024-01-15 10:00:00',
            updatedAt: '2024-01-15 10:00:00',
            columnId: 'todo',
            assignee: { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
            creator: { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' },
            timeEstimate: { hours: 8, minutes: 0 },
            timeTracked: { hours: 0, minutes: 0, seconds: 0 },
            timerRunning: false,
            subtasks: [
              { id: 1, title: 'Создать вайрфреймы', completed: true },
              { id: 2, title: 'Разработать цветовую схему', completed: false },
              { id: 3, title: 'Создать адаптивную версию', completed: false }
            ],
            checklist: [
              { id: 1, text: 'Проверить usability', completed: false },
              { id: 2, text: 'Согласовать с заказчиком', completed: false }
            ],
            comments: []
          }
        ]
      },
      // ... остальные колонки
    ]
  }
])

// Текущий проект
const currentProject = ref(projects.value[0])

// Состояние UI
const projectDialogVisible = ref(false)
const teamMemberDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteColumnDialogVisible = ref(false)

// Формы и временные данные
const projectForm = ref({ name: '', description: '' })
const teamMemberForm = ref({ name: '', role: '', avatar: '', projects: [] })
const editingProject = ref(null)
const editingTeamMember = ref(null)
const projectToDelete = ref(null)
const columnToDelete = ref(null)
const currentColumnId = ref('')
const currentTask = ref(null)
const editingTask = ref(null)
const newComment = ref('')

// Таймер для трекинга времени
function toggleTimer() {
  if (!currentTask.value) return
  
  currentTask.value.timerRunning = !currentTask.value.timerRunning
  
  if (currentTask.value.timerRunning) {
    startTimer()
  } else {
    stopTimer()
  }
  
  updateTask(currentTask.value)
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (currentTask.value && currentTask.value.timerRunning) {
      currentTask.value.timeTracked.seconds++
      
      if (currentTask.value.timeTracked.seconds >= 60) {
        currentTask.value.timeTracked.seconds = 0
        currentTask.value.timeTracked.minutes++
      }
      
      if (currentTask.value.timeTracked.minutes >= 60) {
        currentTask.value.timeTracked.minutes = 0
        currentTask.value.timeTracked.hours++
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resetTimer() {
  if (currentTask.value) {
    currentTask.value.timeTracked = { hours: 0, minutes: 0, seconds: 0 }
    currentTask.value.timerRunning = false
    stopTimer()
    updateTask(currentTask.value)
  }
}

function formatTrackedTime(time) {
  return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
}

// Подзадачи
function addSubtask() {
  if (!currentTask.value) return
  
  if (!currentTask.value.subtasks) {
    currentTask.value.subtasks = []
  }
  
  currentTask.value.subtasks.push({
    id: Date.now(),
    title: 'Новая подзадача',
    completed: false
  })
  
  updateTask(currentTask.value)
}

function updateSubtask(subtask) {
  updateTask(currentTask.value)
}

function removeSubtask(index) {
  if (currentTask.value && currentTask.value.subtasks) {
    currentTask.value.subtasks.splice(index, 1)
    updateTask(currentTask.value)
  }
}

// Чек-лист
function addChecklistItem() {
  if (!currentTask.value) return
  
  if (!currentTask.value.checklist) {
    currentTask.value.checklist = []
  }
  
  currentTask.value.checklist.push({
    id: Date.now(),
    text: 'Новый пункт',
    completed: false
  })
  
  updateTask(currentTask.value)
}

function updateChecklistItem(item) {
  updateTask(currentTask.value)
}

function removeChecklistItem(index) {
  if (currentTask.value && currentTask.value.checklist) {
    currentTask.value.checklist.splice(index, 1)
    updateTask(currentTask.value)
  }
}

// Управление проектами
function startEditingProjectTitle() {
  projectTitleEditing.value = true
  nextTick(() => {
    if (projectTitleInput.value) {
      projectTitleInput.value.focus()
    }
  })
}

function finishEditingProjectTitle() {
  projectTitleEditing.value = false
  saveToLocalStorage()
}

function startEditingProjectDescription() {
  projectDescriptionEditing.value = true
  nextTick(() => {
    if (projectDescriptionInput.value) {
      projectDescriptionInput.value.focus()
    }
  })
}

function finishEditingProjectDescription() {
  projectDescriptionEditing.value = false
  saveToLocalStorage()
}

// Управление командой
function openAddTeamMemberDialog() {
  teamMemberForm.value = { name: '', role: '', avatar: '', projects: [] }
  editingTeamMember.value = null
  teamMemberDialogVisible.value = true
}

function openEditTeamMemberDialog(member) {
  teamMemberForm.value = { ...member }
  editingTeamMember.value = member
  teamMemberDialogVisible.value = true
}

function saveTeamMember() {
  if (!teamMemberForm.value.name.trim() || !teamMemberForm.value.role.trim()) return

  if (editingTeamMember.value) {
    Object.assign(editingTeamMember.value, teamMemberForm.value)
  } else {
    const newMember = {
      id: Date.now(),
      ...teamMemberForm.value
    }
    teamMembers.value.push(newMember)
  }

  teamMemberDialogVisible.value = false
  saveToLocalStorage()
}

function getProjectName(projectId) {
  const project = projects.value.find(p => p.id === projectId)
  return project ? project.name : 'Неизвестный проект'
}

// Остальные методы остаются без изменений...

onMounted(() => {
  loadFromLocalStorage()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: white;
}

/* Сайдбар */
.sidebar {
  width: 280px;
  background: white;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  min-height: 60px;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.collapse-btn {
  margin-left: auto;
}

.user-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.sidebar-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.sidebar-panel {
  flex: 1;
}

.projects-section,
.team-section {
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-weight: 600;
  color: #303133;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.project-item:hover {
  background-color: #f5f7fa;
}

.project-item.active {
  background-color: #ecf5ff;
}

.project-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  flex-shrink: 0;
}

.project-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.project-name {
  display: block;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-stats {
  font-size: 12px;
  color: #909399;
}

.icon-btn {
  width: 100%;
  margin-bottom: 8px;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.team-member:hover {
  background-color: #f5f7fa;
}

.member-info {
  flex: 1;
}

.member-name {
  display: block;
  font-weight: 500;
  color: #303133;
}

.member-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.member-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.project-tag {
  font-size: 10px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  color: #666;
}

.member-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.team-member:hover .member-actions {
  opacity: 1;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
  margin-left: 120px; /* Отступ от сайдбара */
}

.main-content.sidebar-collapsed {
  margin-left: 120px;
}

.project-header {
  padding: 24px 32px 0;
  background: white;
}

.project-title-section {
  max-width: 800px;
}

.project-title-display,
.project-description-display {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.project-title-display:hover,
.project-description-display:hover {
  background-color: #f5f7fa;
}

.project-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.project-description {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.project-title-input,
.project-description-input {
  margin-bottom: 16px;
}

.project-title-input :deep(.el-input__inner) {
  border: none;
  font-size: 32px;
  font-weight: 700;
  padding: 0;
  background: transparent;
  color: #1f2937;
}

.project-description-input :deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  background: transparent;
  color: #6b7280;
  resize: none;
  font-size: 16px;
}

.project-placeholder h1 {
  color: #909399;
  font-size: 24px;
  margin: 0;
}

/* Вкладки */
.view-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 32px;
}

.view-tabs :deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.view-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.view-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.view-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

/* Канбан доска */
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board {
  flex: 1;
  padding: 20px 0;
  overflow-x: auto;
  background: white;
}

.columns-container {
  display: flex;
  gap: 20px;
  height: 100%;
  align-items: flex-start;
  min-width: min-content;
}

.column-wrapper {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
}

.column {
  background: color-mix(in srgb, var(--column-color) 5%, white);
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--column-color) 15%, white);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--column-color) 10%, white);
}

.column-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.column-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.column-color-indicator:hover {
  transform: scale(1.1);
}

.column-title-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.column-title-display:hover {
  background-color: color-mix(in srgb, var(--column-color) 8%, transparent);
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-count {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--column-color) 15%, white);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.column-title-input {
  flex: 1;
}

.column-menu {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-menu {
  opacity: 1;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 4px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  border-left: 3px solid var(--column-color, #409eff);
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.task-header {
  margin-bottom: 8px;
}

.task-title {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignee-info {
  display: flex;
  align-items: center;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.column-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--column-color) 10%, white);
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-footer {
  opacity: 1;
}

.add-column-section {
  margin-left: 20px;
  flex-shrink: 0;
}

.add-column-btn {
  height: 100%;
  min-height: 200px;
  width: 280px;
  border: 2px dashed #dcdfe6;
  background: white;
  border-radius: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin: 20px;
  border-radius: 8px;
}

/* Боковая панель деталей задачи */
.task-detail-drawer :deep(.el-drawer) {
  border-radius: 12px 0 0 12px;
  width: 40% !important;
}

.task-detail-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.task-detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-detail-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  color: #909399;
}

.task-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.task-title-section {
  margin-bottom: 24px;
  padding-top: 16px;
}

.task-main-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

/* Трекинг времени */
.time-tracking-section {
  margin-bottom: 24px;
}

.time-tracking-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-estimate,
.time-tracked {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-estimate label,
.time-tracked label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input-group :deep(.el-input-number) {
  width: 80px;
}

.tracked-time {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.timer-controls {
  display: flex;
  gap: 8px;
}

.timer-controls :deep(.el-button) {
  transition: all 0.3s ease;
}

.timer-controls :deep(.el-button.active) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

/* Свойства задачи */
.task-properties {
  margin-bottom: 24px;
}

.property-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.property-item {
  flex: 1;
}

.property-item.full-width {
  flex: 0 0 100%;
}

.property-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
  display: block;
}

.property-value {
  min-height: auto;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.empty-value {
  color: #9ca3af;
  font-style: italic;
}

.deadline-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.deadline-display.overdue {
  background: #fef2f2;
  border-color: #fecaca;
}

.deadline-text {
  font-weight: 500;
}

.time-remaining-tag {
  margin-left: auto;
}

.date-value {
  color: #6b7280;
  font-size: 14px;
  padding: 8px 0;
}

/* Подзадачи и чек-лист */
.subtasks-section,
.checklist-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.subtasks-list,
.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item,
.checklist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

:deep(.el-checkbox) {
  flex: 1;
}

:deep(.el-checkbox__label) {
  color: #374151;
}

.completed {
  text-decoration: line-through;
  color: #9ca3af !important;
}

.empty-subtasks,
.empty-checklist {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

/* Описание */
.description-section {
  margin-bottom: 24px;
}

.description-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.task-description-content {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.description-text {
  margin: 0;
  line-height: 1.6;
  color: #4b5563;
  white-space: pre-wrap;
}

.empty-description {
  margin: 0;
  color: #9ca3af;
  font-style: italic;
}

/* Комментарии */
.comments-section {
  margin-bottom: 24px;
}

.comments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.comments-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.comments-count {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.comment-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-content {
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
}

.empty-comments {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

.add-comment-section {
  margin-top: 16px;
}

.comment-input-wrapper {
  display: flex;
  gap: 12px;
}

.current-user-avatar {
  flex-shrink: 0;
}

.comment-input-container {
  flex: 1;
}

.comment-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  resize: none;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.task-detail-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .column-wrapper {
    min-width: 260px;
  }
  
  .task-detail-drawer :deep(.el-drawer) {
    width: 50% !important;
  }
  
  .main-content {
    margin-left: 100px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
  }
  
  .main-content {
    margin-left: 0 !important;
  }
  
  .project-header {
    padding: 16px;
  }
  
  .view-tabs {
    padding: 0 16px;
  }
  
  .columns-container {
    flex-direction: column;
  }
  
  .column-wrapper {
    min-width: auto;
    max-width: none;
  }
  
  .add-column-section {
    margin-left: 0;
    margin-top: 16px;
  }
  
  .add-column-btn {
    width: 100%;
    min-height: 60px;
  }
  
  .task-detail-drawer :deep(.el-drawer) {
    width: 90% !important;
  }
  
  .property-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .time-display {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .tracked-time {
    width: 100%;
    justify-content: space-between;
  }
}
</style>