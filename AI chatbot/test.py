# 使用以下代码检查NVIDIA GPU是否可用
import torch
print("CUDA是否可用:", torch.cuda.is_available())
print("GPU数量:", torch.cuda.device_count())
if torch.cuda.is_available():
    print("当前GPU:", torch.cuda.get_device_name(0))
    
    import torch

# 检查CUDA是否可用
if torch.cuda.is_available():
    print("CUDA可用")
    # 创建一个张量并移动到GPU
    x = torch.tensor([1.0, 2.0, 3.0]).cuda()
    print(x.device)  # 应该显示 'cuda:0'
else:
    print("CUDA不可用")
    
import torch

if torch.cuda.is_available():
    # 查看总内存
    print(f"总显存: {torch.cuda.get_device_properties(0).total_memory / 1024**2:.2f} MB")
    # 查看当前分配的显存
    print(f"已分配显存: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")
    # 查看缓存显存
    print(f"缓存显存: {torch.cuda.memory_reserved(0) / 1024**2:.2f} MB")