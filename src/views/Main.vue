<template>
  <div id="main" class="main">
    <div class="header" v-if="!isFullscreen">
      <div class="offline">
        <img
          v-show="!isOnline"
          alt=""
          class="animate__animated animate__pulse animate__infinite"
          :src="`${require('../assets/images/no_network@2x.png')}`"
        />
      </div>
      <div class="delroute" @click="clickDelroute">班次刪除(F2)</div>
      <div class="setting" @click="clickSetting">設置(F10)</div>
      <div class="fullscreen" @click="clickFullscreen">全屏(F11)</div>
    </div>

    <div class="container">
      <div
        :class="['mainContainer', !isWaiting ? 'ADMode-container-padding' : '']"
      >
        <!-- 2021-07-13 新增 banner -->
        <div class="banner">
          <!-- 即將發車 -->
          <el-image
            :src="`${require('../assets/images/v20210709/img_02.png')}`"
            fit="contain"
            class="tips"
            v-if="isWaiting"
          ></el-image>
          <!-- 請耐心等候 -->
          <el-image
            :src="`${require('../assets/images/v20210709/img_03.png')}`"
            fit="contain"
            class="tips"
            v-if="!isWaiting"
          ></el-image>
          <!-- logo -->
          <!-- <el-image
            :src="`${require('../assets/images/v20210709/img_07.png')}`"
            fit="contain"
            class="bg"
          ></el-image> -->
          <el-image
            class="logo"
            fit="contain"
            :src="require('../assets/images/v20210709/TRANSMAC_logo.png')"
          ></el-image>
        </div>
        <div class="bottomModule">
          <!-- 左側 -->
          <div class="left" v-show="isWaiting">
            <div class="title">
              <div class="route-code">
                <span>路 線</span>
                <span>Carreira</span>
              </div>
              <div class="bus-code">
                <span>車 牌</span>
                <span>Matrícula</span>
              </div>
            </div>
            <!-- vue -->
            <transition-group
              tag="div"
              class="routes"
              enter-active-class="animate__animated animate__fadeInUp"
            >
              <div
                :class="['route-item', idx == 2 ? 'route-item-last' : '']"
                v-for="(item, idx) in XFL_ROUTE_CODE_LIST"
                :key="'route_item_' + idx"
              >
                <div class="item-inner">
                  <div class="route-code">{{ item }}</div>
                  <div class="bus-code">
                    {{
                      XFL_ROUTE_LIST[idx] && XFL_ROUTE_LIST[idx][0]
                        ? XFL_ROUTE_LIST[idx][0].bus_plate
                        : ""
                    }}
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
          <!-- 廣告 -->
          <div class="adModule" v-show="!isWaiting">
            <el-carousel
              height="100%"
              :autoplay="false"
              indicator-position="none"
              arrow="never"
              ref="AdsCarousel"
              @change="AdModuleChangeAction"
            >
              <el-carousel-item
                v-for="(item, cIdx) in Ads"
                :key="'item_' + cIdx"
              >
                <!-- 圖片 -->
                <el-image
                  fit="contain"
                  :src="item.name"
                  style="width: 100%; height: 100%"
                  v-if="item.type == 'image'"
                ></el-image>
                <!-- 視頻 -->
                <video
                  width="100%"
                  height="100%"
                  :ref="item.refName"
                  muted
                  preload="auto"
                  v-if="item.type == 'video'"
                >
                  <source :src="item.name" type="video/mp4" />
                </video>
              </el-carousel-item>
            </el-carousel>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      title="設置"
      :visible.sync="settingVisible"
      custom-class="setting-box"
      :show-close="false"
      @open="dialogOpened"
    >
      <el-form
        :label-position="labelPosition"
        label-width="80px"
        :model="formData"
      >
        <el-row :gutter="20">
          <el-col :span="12" :offset="0">
            <el-form-item label="站點編號">
              <el-input
                v-model="formData.stationCode"
                label="站點編號"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12" :offset="0">
            <el-form-item label="顯示屏序號">
              <el-input
                v-model="formData.screenNo"
                label="顯示屏序號"
                placeholder="默認為1，有多個屏請分別添加序號"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item class="routeCodeFormItem">
          <template #label>
            <div class="routeCodeFormItem__label">
              <div class="label">顯示路線</div>
            </div>
          </template>
          <el-button
            type="primary"
            v-if="!routeCodeInputVisible"
            class="button-new-tag"
            icon="el-icon-circle-plus-outline"
            @click="showRouteCodeInput"
            >添加路線</el-button
          >
          <div class="tags">
            <div
              class="noresult"
              v-if="formData.routeCodeArr.length == 0 && !routeCodeInputVisible"
            >
              請添加顯示路線
            </div>
            <el-tag
              effect="plain"
              :key="tag + '_' + idx"
              v-for="(tag, idx) in formData.routeCodeArr"
              closable
              :disable-transitions="true"
              @close="handleRouteCodeDel(idx)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              class="input-new-tag"
              v-if="routeCodeInputVisible"
              v-model="routeCodeInput"
              ref="saveTagInput"
              @keyup.enter.native="handleRouteCodeInputConfirm"
              @blur="handleRouteCodeInputConfirm"
            >
            </el-input>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="settingVisible = false">取 消</el-button>
        <el-button id="btn-save" type="primary" @click="saveScreenId"
          >提 交</el-button
        >
      </span>
    </el-dialog>
    <!--custom-class="setting-box"-->
    <el-dialog
      title="班次刪除"
      :visible.sync="delrouteVisible"
      custom-class="route-box"
      :show-close="true"
    >
      <el-table
        :data="XFL_ROUTE_LIST"
        style="width: 100%"
        header-cell-class-name="route-header"
        cell-class-name="route-cell"
      >
        <el-table-column
          label="路線"
          width="120"
          align="center"
          header-align="center"
        >
          <template slot-scope="scope" v-if="scope.row[0]">
            {{ scope.row[0].route_code }}
          </template>
        </el-table-column>
        <el-table-column
          label="車牌"
          width="220"
          align="center"
          header-align="center"
        >
          <template slot-scope="scope" v-if="scope.row[0]">
            {{ scope.row[0].bus_plate }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" header-align="center">
          <template slot-scope="scope" v-if="scope.row[0]">
            <!--<el-button size="mini" @click="handleDelete(scope.$index, scope.row)">刪除</el-button>-->
            <i
              class="el-icon-delete route-delete"
              @click="handleDelete(scope.$index, scope.row)"
            ></i>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script src="./Main.js"></script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style src="../assets/less/Main.less" lang="less"></style>
