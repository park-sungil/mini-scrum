<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const dashboard = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    dashboard.value = await api.getDashboard()
  } catch (e) {
    console.error('Failed to load dashboard:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">대시보드</h1>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else-if="dashboard">
      <!-- Sprint Summary -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">
          현재 스프린트: {{ dashboard.currentSprint?.title || '없음' }}
        </h2>
        <div v-if="dashboard.currentSprint" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-slate-700">{{ dashboard.taskSummary?.total || 0 }}</div>
            <div class="text-sm text-slate-500 mt-1">전체 업무</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">{{ dashboard.taskSummary?.todo || 0 }}</div>
            <div class="text-sm text-slate-500 mt-1">할 일</div>
          </div>
          <div class="bg-amber-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-amber-600">{{ dashboard.taskSummary?.in_progress || 0 }}</div>
            <div class="text-sm text-slate-500 mt-1">진행 중</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-600">{{ dashboard.taskSummary?.done || 0 }}</div>
            <div class="text-sm text-slate-500 mt-1">완료</div>
          </div>
        </div>
        <div v-else class="text-slate-500 text-center py-8">
          활성 스프린트가 없습니다. 스프린트 메뉴에서 새 스프린트를 생성하세요.
        </div>
      </div>

      <!-- Member Tasks -->
      <div v-if="dashboard.memberTasks?.length" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">팀원별 업무 현황</h2>
        <div class="space-y-3">
          <div
            v-for="member in dashboard.memberTasks"
            :key="member.id"
            class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            <div class="font-medium text-slate-700">{{ member.name }}</div>
            <div class="flex gap-3 text-sm">
              <span class="text-blue-600">할 일 {{ member.todo }}</span>
              <span class="text-amber-600">진행 {{ member.in_progress }}</span>
              <span class="text-green-600">완료 {{ member.done }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-slate-500">
      데이터를 불러올 수 없습니다. 서버 연결을 확인하세요.
    </div>
  </div>
</template>
